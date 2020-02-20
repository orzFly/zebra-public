import { Filename, npath, PortablePath, ppath, toFilename, xfs, ZipFS } from "@yarnpkg/fslib";
import { getLibzipPromise } from '@yarnpkg/libzip';
import globby from "globby";
import { tmpdir } from "os";
import rimraf from 'rimraf';
import { copyPromise } from "../models/copyPromise";
import { Project } from "../models/Project";
import { Solution } from "../models/Solution";
import { Assert } from "../utilities/Assert";
import { map, resolve } from "../utilities/DependencyGraph";
import { getParentPath } from "../utilities/FilesystemUtils";
import { Command } from "../utilities/TaskContext";

export class ArchiveCommand extends Command {
  solution!: Solution

  workingDir!: PortablePath

  @Command.Path('@archive')
  @Command.Path("archive")
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

    const resolvedDependencyMap = map(resolve(this.solution.projectDependencyMap))
    const dependencies = resolvedDependencyMap.get(this.solution.activeProject.dependencyTag)!.filter((i) => i.type === 'project').map((i) => (i.type === 'project' ? i.project : null)!);

    for (const project of dependencies) {
      const relativePath = this.getPathRelatedToRoot(project.projectRoot)
      await this.copyPackage([relativePath], project);
    }
    await this.copyPackage([], this.solution.activeProject);

    const targetManifest = JSON.parse(JSON.stringify(this.solution.activeProject.manifest));
    targetManifest.workspaces = [...new Set([
      ...targetManifest.workspaces || [],
      ...this.solution.rootProject.manifest.workspaces || [],
    ])];
    targetManifest.private = true;
    this.rewritePackageJson(targetManifest);
    await xfs.writeFilePromise(
      ppath.resolve(this.workingDir, toFilename("package.json")),
      `${JSON.stringify(targetManifest, null, 2)}\n`
    );

    await this.taskContext.execute("yarn --forzen-lockfile --production", [], { cwd: this.workingDir });

    const result = ppath.resolve(this.cwd, toFilename("dist"), toFilename("archive.zip"));
    await xfs.mkdirpPromise(ppath.dirname(result));
    if (await xfs.existsPromise(result)) await xfs.removePromise(result);
    const zip = new ZipFS(result, { libzip: await getLibzipPromise(), create: true });
    await zip.copyPromise(zip.pathUtils.resolve('/' as any), this.workingDir, { baseFs: xfs });
    zip.saveAndClose();

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

    (await globby(["license*"], {
      absolute: true,
      onlyFiles: true,
      deep: 0,
      caseSensitiveMatch: false,
      cwd: npath.fromPortablePath(project.projectRoot),
      expandDirectories: false,
      followSymbolicLinks: false,
    })).forEach((i) => files.add(npath.toPortablePath(i)))

    if ((project.manifest as any).files) {
      (await globby((project.manifest as any).files, {
        absolute: true,
        cwd: npath.fromPortablePath(project.projectRoot),
        expandDirectories: true,
        followSymbolicLinks: false,
      })).forEach((i) => files.add(npath.toPortablePath(i)))
    } else {
      throw new Error(`No files in package.json - do not know what to copy: ${project.projectRoot}`);
    }

    for (const file of files) {
      if (file.endsWith(".d.ts") || file.endsWith(".d.ts.map")) {
        files.delete(file)
      } else if (file.endsWith(".map")) {
        try {
          const map = await xfs.readJsonPromise(file);
          Assert(!map.sourceRoot, "Cannot parse sourceMap with sourceRoot");
          (map.sources || []).forEach((i: string) => {
            files.add(npath.toPortablePath(npath.resolve(npath.fromPortablePath(ppath.dirname(file)), i)))
          })
        } catch { }
      }
    }

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