import { PortablePath, ppath, toFilename, xfs } from "@yarnpkg/fslib";
import { Solution } from "../models/Solution";
import { Command } from "../utilities/TaskContext";

export class CollectDistCommand extends Command {
  solution!: Solution

  workingDir!: PortablePath

  @Command.String("--prefix")
  prefix: string = ""

  @Command.String("--affix")
  affix: string = ""

  sanitizeFilename(str: string) {
    return String(str || "")
      .replace(/[\/\\*?<>:|"'@-]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/ /g, "-");
  }

  @Command.Path('@collectDist')
  async execute(): Promise<number | void> {
    this.solution = await Solution.require(this.cwd);
    const prefix = this.sanitizeFilename(this.prefix);
    const affix = this.sanitizeFilename(this.affix);
    const operations: [PortablePath, PortablePath][] = []
    const targetDir = ppath.resolve(this.solution.solutionRoot, toFilename("dist"))

    for (const project of this.solution.allProjects()) {
      if (project === this.solution.rootProject) continue;

      const distDir = ppath.resolve(project.projectRoot, toFilename("dist"))
      if (!await xfs.existsPromise(distDir)) continue;

      const stat = await xfs.statPromise(distDir)
      if (!stat.isDirectory()) continue;

      const files = await xfs.readdirPromise(distDir, { withFileTypes: true })
      for (const file of files) {
        if (file.isBlockDevice()) continue;
        if (file.isCharacterDevice()) continue;
        if (file.isDirectory()) continue;
        if (file.isFIFO()) continue;
        if (file.isSocket()) continue;
        if (file.isSymbolicLink()) continue;
        if (!file.isFile()) continue;

        const distPath = ppath.resolve(distDir, file.name);
        const targetPath = ppath.resolve(targetDir, toFilename([
          prefix, this.sanitizeFilename(project.name),
          this.sanitizeFilename((project.manifest as any).version || ""),
          affix, file.name
        ].filter((i) => !!i).join("-")));
        operations.push([distPath, targetPath]);
      }
    }

    await xfs.mkdirpPromise(targetDir);
    for (const [source, dist] of operations) {
      this.console.log("Source:", source)
      this.console.log("Dist:  ", dist)
      this.console.log("Size:  ", (await xfs.statPromise(source)).size)
      await xfs.copyFilePromise(source, dist);
    }
  }
}