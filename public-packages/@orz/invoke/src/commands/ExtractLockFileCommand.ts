import { Filename, npath, PortablePath, ppath, toFilename, xfs } from "@yarnpkg/fslib";
import { tmpdir } from "os";
import rimraf from 'rimraf';
import { copyPromise } from "../models/copyPromise";
import { Project } from "../models/Project";
import { Solution } from "../models/Solution";
import { Assert } from "../utilities/Assert";
import { getParentPath } from "../utilities/FilesystemUtils";
import { Command } from "../utilities/TaskContext";

export class ExtractLockFileCommand extends Command {
  solution!: Solution

  workingDir!: PortablePath

  @Command.Path('@extractLockFile')
  async execute(): Promise<number | void> {
    this.solution = await Solution.require(this.cwd);

    const tmpDir = await this.getTmpDir();
    this.workingDir = await this.generateTmpFileName(tmpDir);
    await xfs.mkdirPromise(this.workingDir);

    for (const path of [
      [toFilename(".yarn")],
      [toFilename(".npmrc")],
      [toFilename(".nvmrc")],
      [toFilename(".yarnrc")],
      [toFilename(".yarnrc.yml")],
      [toFilename("yarn.lock")],
    ] as const) {
      await this.syncRootPath(path);
    }

    for (const project of this.solution.allProjects()) {
      const relativePath = this.getPathRelatedToRoot(project.projectRoot)
      await this.copyPackage([relativePath], project);
    }
    await this.copyPackage([], this.solution.activeProject);

    const targetManifest = JSON.parse(JSON.stringify(this.solution.activeProject.manifest));
    targetManifest.workspaces = [...new Set([
      ...targetManifest.workspaces as string[] || [],
      ...this.solution.rootProject.manifest.workspaces || [],
    ])];
    targetManifest.workspaces = targetManifest.workspaces.filter((i: string) => !i.startsWith('packages/'))
    targetManifest.private = true;
    this.rewritePackageJson(targetManifest);
    await xfs.writeFilePromise(
      ppath.resolve(this.workingDir, toFilename("package.json")),
      `${JSON.stringify(targetManifest, null, 2)}\n`
    );

    const rc = await this.taskContext.execute("yarn install --forzen-lockfile", [], {
      cwd: this.workingDir, env: {
        ...this.env,
        "YARN_ORZ_NO_INSTALL": "1"
      }
    });
    if (rc) throw new Error(`Invalid yarn return value: ${rc}`)

    await xfs.copyFilePromise(
      ppath.resolve(this.workingDir, toFilename("yarn.lock")),
      ppath.resolve(this.solution.solutionRoot, toFilename("yarn-public.lock")),
    )

    await this.safeRimraf(npath.fromPortablePath(this.workingDir))
  }

  safeBlacklist = [
    "/", "/bin", "/boot", "/dev", "/etc", "/home", "/lib", "/lib64", "/media", "/mnt", "/opt", "/proc", "/root", "/run", "/sbin", "/srv", "/sys", "/tmp", "/usr", "/var",
    // ...Array(26).fill(0).map((_, index) => String.fromCharCode(65 + index)).flatMap((i) => [])
  ]

  async safeRimraf(path: string) {
    path = npath.normalize(path)
    if (!path || this.safeBlacklist.some((i) => i === path || npath.normalize(i) === path)) throw new Error(`Trying to remove unsafe path: ${path}`);

    await new Promise((resolve, reject) => {
      rimraf(path, { disableGlob: true }, (error) => {
        if (error) reject(error); else resolve();
      })
    })
  }

  rewritePackageJson(input: any) {
    input.scripts = Object.fromEntries(Object.entries<string>(input.scripts || {}).filter(([, value]) => !value.startsWith("invoke ")))
    for (const key of Object.keys(input).filter((i) => i.startsWith("invoke/"))) { delete input[key]; };
  }

  getPathRelatedToRoot(path: PortablePath, base: PortablePath = this.solution.solutionRoot) {
    const relativePath = ppath.relative(base, path)
    Assert.isFalse(relativePath.startsWith("./"), "Unsupported relative path")
    Assert.isFalse(relativePath.startsWith("../"), "Unsupported relative path")
    Assert.isFalse(relativePath === '.', "Unsupported relative path")
    return relativePath;
  }

  async copyPackage(dst: readonly (PortablePath | Filename)[], project: Project) {
    const basePath = ppath.resolve(this.workingDir, ...dst);
    const files = new Set<PortablePath>();

    files.add(ppath.resolve(project.projectRoot, toFilename("package.json")));

    const whitelist = new Set<PortablePath>();
    whitelist.add(ppath.normalize(project.projectRoot));
    for (const file of files) {
      const normalizedPath = ppath.normalize(file);
      this.getPathRelatedToRoot(normalizedPath, project.projectRoot)
      whitelist.add(normalizedPath);
      let parent: PortablePath | null = normalizedPath
      while (parent = getParentPath(parent)) {
        if (parent === project.projectRoot) break;
        whitelist.add(parent)
      }
    }

    await copyPromise(
      xfs, basePath,
      xfs, ppath.normalize(project.projectRoot),
      { overwrite: true, whitelist: Array.from(whitelist) }
    );
  }

  async syncRootPath(filename: readonly (PortablePath | Filename)[]) {
    const source = ppath.resolve(this.solution.solutionRoot, ...filename);
    if (!await xfs.existsPromise(source)) return;

    await copyPromise(
      xfs, ppath.resolve(this.workingDir, ...filename),
      xfs, source,
      { overwrite: true }
    );
  }

  async getTmpDir() {
    Assert.isTruthy(tmpdir(), "Invalid tmpdir");
    return npath.toPortablePath(tmpdir())
  }

  async generateTmpFileName(dir: PortablePath) {
    let fullPath: PortablePath
    do {
      fullPath = ppath.resolve(dir, toFilename(`invoke-archive-${Math.random().toFixed(10).slice(2)}${Math.random().toFixed(10).slice(2)}`))
    } while (await xfs.existsPromise(fullPath))
    return fullPath;
  }
}
