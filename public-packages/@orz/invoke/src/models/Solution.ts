import { npath, PortablePath } from "@yarnpkg/fslib";
import { LazyGetter } from 'lazy-get-decorator';
import { Assert } from "../utilities/Assert";
import { DepMap, newDepMap } from '../utilities/DependencyGraph';
import { getParentPath } from "../utilities/FilesystemUtils";
import { mutable, mutableMap } from "../utilities/Mutable";
import { PackageManifest } from "./PackageManifest";
import { Project } from "./Project";
import { Tag } from './Tag';

const INTERNAL = Symbol()

export class Solution {
  readonly solutionRoot!: PortablePath
  readonly manifest!: PackageManifest
  readonly rootProject!: Project
  readonly projectsByRoot: ReadonlyMap<string, Project> = new Map<string, Project>();
  readonly projectsByPackageName: ReadonlyMap<string, Project> = new Map<string, Project>();
  readonly tag!: Tag

  activeProject!: Project

  private constructor(internal: typeof INTERNAL) { if (internal !== INTERNAL) throw new Error('Private constructor'); }

  private addProject(project: Project) {
    const mutableByRoot = mutableMap(this.projectsByRoot);
    const mutableByPackageName = mutableMap(this.projectsByPackageName);
    Assert(!project.solution || project.solution === this, `Project already belonged to another solution`);
    Assert(!mutableByRoot.has(project.projectRoot) || mutableByRoot.get(project.projectRoot) === project, `Solution already has a project at ${project.projectRoot}`);
    if (project.packageName) {
      Assert(!mutableByPackageName.has(project.packageName) || mutableByPackageName.get(project.packageName) === project, `Solution already has a project called ${project.packageName}`);
    }

    project.solution = this;
    mutableByRoot.set(project.projectRoot, project);
    if (project.packageName) {
      mutableByPackageName.set(project.packageName, project);
    }
  }

  allProjects() {
    return this.projectsByRoot.values()
  }

  private async loadFullWorkspace() {
    const visited = new Set<Project>();
    let visitedNew = true;
    while (visitedNew) {
      visitedNew = false;
      for (const item of this.allProjects()) {
        if (visited.has(item)) continue;
        visited.add(item); visitedNew = true;

        const roots = await item.getWorkspaceProjectRoots()
        for (const root of roots) {
          if (!this.projectsByRoot.has(root)) {
            this.addProject(await Project.fromRoot(root))
          }
        }
      }
    }
  }

  @LazyGetter()
  get projectDependencyMap(): DepMap<Tag> {
    const map = newDepMap<Tag>();

    for (const project of this.allProjects()) {
      const dependencies = Array.from(project.dependencies)
      const projects = dependencies.map((i) => this.projectsByPackageName.get(i)!).filter((i) => !!i)
      map.set(project.tag, [project.dependencyTag])
      map.set(project.dependencyTag, projects.map((i) => i.tag))
    }

    const solutionDependency = new Set([
      ...(map.get(this.tag) || []),
      ...Array.from(this.allProjects()).map((i) => i.tag),
    ])
    solutionDependency.delete(this.tag)
    map.set(this.tag, Array.from(solutionDependency));
    return map;
  }

  @LazyGetter()
  get projectProductionDependencyMap(): DepMap<Tag> {
    const map = newDepMap<Tag>();

    for (const project of this.allProjects()) {
      const dependencies = Array.from(project.productionDependencies)
      const projects = dependencies.map((i) => this.projectsByPackageName.get(i)!).filter((i) => !!i)
      map.set(project.tag, [project.dependencyTag])
      map.set(project.dependencyTag, projects.map((i) => i.tag))
    }

    const solutionDependency = new Set([
      ...(map.get(this.tag) || []),
      ...Array.from(this.allProjects()).map((i) => i.tag),
    ])
    solutionDependency.delete(this.tag)
    map.set(this.tag, Array.from(solutionDependency));
    return map;
  }

  static async require(startingDir: PortablePath) {
    const sln = await this.setup(startingDir)
    if (!sln) throw new Error(`No solution found at ${npath.fromPortablePath(startingDir)}. Exiting.`);

    return sln;
  }

  static async setup(startingDir: PortablePath) {
    const sln = new Solution(INTERNAL);
    const mutableSln = mutable(sln);

    const activeProject = await Project.fromStartingDir(startingDir);
    if (!activeProject) return null;
    sln.addProject(activeProject);
    mutableSln.activeProject = activeProject;

    const projectChains = [activeProject];
    let currentDir = getParentPath(startingDir);
    while (currentDir) {
      const parentProject = await Project.fromStartingDir(currentDir, startingDir);
      if (parentProject) {
        const roots = await parentProject.getWorkspaceProjectRoots();

        const lastProject = projectChains[projectChains.length - 1];
        if (roots.has(lastProject.projectRoot)) {
          sln.addProject(parentProject);
          lastProject.parentProject = parentProject;
          projectChains.unshift(parentProject);
        }
        currentDir = getParentPath(parentProject.projectRoot);
      } else {
        currentDir = null;
      }
    }

    mutableSln.rootProject = projectChains[0];
    mutableSln.solutionRoot = mutableSln.rootProject.projectRoot;
    mutableSln.tag = mutableSln.rootProject.tag;

    await sln.loadFullWorkspace();
    return sln;
  }
}
