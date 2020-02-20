import { npath, PortablePath, ppath, toFilename, xfs } from "@yarnpkg/fslib";
import globby from "globby";
import { LazyGetter } from 'lazy-get-decorator';
import { DepMap, newDepMap } from "../utilities/DependencyGraph";
import { discoverSymbolFile } from "../utilities/FilesystemUtils";
import { loadPackageManifest, PackageManifest, PipelineMetaConfig, PipelineStageCommands } from "./PackageManifest";
import { Solution } from "./Solution";
import { createActionTag, createProjectDependencyTag, createProjectTag, Tag } from "./Tag";

const INTERNAL = Symbol()

type Mutable<ObjectType> = {
  -readonly [KeyType in keyof ObjectType]: ObjectType[KeyType];
};

export interface PipelineAction {
  name: string,
  requires: string[],
  stageCommands: PipelineStageCommands
  tag: Tag
}

export class Project {
  static readonly packageManifestFilename = toFilename("package.json");

  private constructor(internal: typeof INTERNAL) { if (internal !== INTERNAL) throw new Error('Private constructor'); }
  readonly projectRoot!: PortablePath
  readonly manifest!: PackageManifest

  readonly tag!: Tag
  readonly dependencyTag!: Tag

  solution?: Solution
  parentProject?: Project

  static async fromRoot(projectRoot: PortablePath) {
    const project = new Project(INTERNAL);
    const mutableProject = project as Mutable<Project>;

    mutableProject.projectRoot = projectRoot;
    mutableProject.manifest = await loadPackageManifest(ppath.resolve(projectRoot, this.packageManifestFilename))
    mutableProject.tag = createProjectTag(project);
    mutableProject.dependencyTag = createProjectDependencyTag(project);

    return project;
  }

  static async fromStartingDir(startingDir: PortablePath, anchorDir?: PortablePath) {
    const projectRoot = await discoverSymbolFile({ startingDir, symbol: Project.packageManifestFilename, anchorDir });
    if (!projectRoot) return null;

    return await Project.fromRoot(projectRoot);
  }

  async getWorkspaceProjectRoots() {
    // FIXME: this can be stored
    return this.resolveWorkspaceProjectRoots();
  }

  // https://github.com/yarnpkg/berry/blob/dd92aa54d64148e00d3831b93220acf859135c59/packages/yarnpkg-core/sources/Workspace.ts#L65
  private async resolveWorkspaceProjectRoots() {
    const roots = new Set<PortablePath>();
    for (const definition of (this.manifest.workspaces || [])) {
      const relativeCwds = await globby(definition, {
        absolute: true,
        cwd: npath.fromPortablePath(this.projectRoot),
        expandDirectories: false,
        onlyDirectories: true,
        onlyFiles: false,
      });

      relativeCwds.sort();

      for (const relativeCwd of relativeCwds) {
        const candidateCwd = ppath.resolve(this.projectRoot, npath.toPortablePath(relativeCwd));

        if (xfs.existsSync(ppath.join(candidateCwd, Project.packageManifestFilename))) {
          roots.add(candidateCwd);
        }
      }
    }

    return roots;
  }

  get name() {
    return this.manifest.name || ppath.dirname(this.projectRoot)
  }

  get packageName() {
    return this.manifest.name || null;
  }

  @LazyGetter()
  get pipelineActions(): readonly PipelineAction[] {
    const config = this.manifest["invoke/pipeline"]
    if(!config || !Object.keys(config).length) return []

    return Object.entries(config).filter(([, item]) => !!item).map(([name, item]) => {
      const entries = Array.from(Object.entries(item))
      const meta = Object.fromEntries(entries.filter(([key]) => key.startsWith("$"))) as any as PipelineMetaConfig
      const stageCommands = Object.fromEntries(entries.filter(([key]) => !key.startsWith("$"))) as any as PipelineStageCommands
      const requires = ([] as Array<string>).concat(meta.$requires || []).flatMap((i) => i.split(",")).filter((i) => !!i)

      const action: PipelineAction = { name, stageCommands, requires, tag: null as any }
      action.tag = createActionTag(this, action);
      return action
    })
  }

  @LazyGetter()
  get pipelineActionTags(): ReadonlyMap<string, Tag> {
    const actionTags = new Map<string, Tag>();
    for (const config of this.pipelineActions) {
      actionTags.set(config.name, createActionTag(this, config));
    }
    return actionTags;
  }

  @LazyGetter()
  get pipelineActionDependencyMap(): DepMap<Tag> {
    const actions = this.pipelineActions;
    const actionTags = this.pipelineActionTags;

    const map = newDepMap<Tag>();
    map.set(this.tag, [...actionTags.values(), this.dependencyTag])
    map.set(this.dependencyTag, [])

    for (const config of actions) {
      map.set(actionTags.get(config.name)!, [
        this.dependencyTag,
        ...config.requires.map((i) => {
          if (!actionTags.has(i)) throw new Error(`Invalid requires on Project ${this.name} Action ${config.name}: ${i}`)
          return actionTags.get(i)!
        })
      ])
    }

    return map;
  }

  @LazyGetter()
  get dependencies(): Set<string> {
    return new Set<string>([
      ...Object.keys(this.manifest.dependencies || {}),
      ...Object.keys(this.manifest.devDependencies || {}),
      ...Object.keys(this.manifest.peerDependencies || {}),
    ]);
  }

  @LazyGetter()
  get productionDependencies(): Set<string> {
    return new Set<string>([
      ...Object.keys(this.manifest.dependencies || {}),
      ...Object.keys(this.manifest.peerDependencies || {}),
    ]);
  }
}
