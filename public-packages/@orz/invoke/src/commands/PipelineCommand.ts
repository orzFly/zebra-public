import { Marline } from '@orz/marline';
import { Chalk } from "chalk";
import { cpus } from "os";
import PQueue from 'p-queue';
import { PipelineStage, PipelineVirtualStage } from "../models/PackageManifest";
import { PipelineAction, Project } from "../models/Project";
import { Solution } from "../models/Solution";
import { Tag } from "../models/Tag";
import { Assert } from "../utilities/Assert";
import { Defer } from '../utilities/Defer';
import { DependencyExecutor } from '../utilities/DependencyExecutor';
import { mergeDepMap, newDepMap } from "../utilities/DependencyGraph";
import { createMemo } from '../utilities/Memo';
import { createPrefixStream } from '../utilities/PrefixStream';
import { Command, TaskContext } from "../utilities/TaskContext";

export class PipelineCommand extends Command {
  static usage = Command.Usage({
    description: `run pipeline`,
  });

  // static schema = {
    // async validate(target: PipelineCommand) {
      // if (error.name === `ValidationError`)
      // error.clipanion = { type: `usage` };
    // }
  // }

  @Command.String({ required: false })
  stage: PipelineVirtualStage | PipelineStage = PipelineStage.build

  concurrency!: number

  excludeDependencies!: boolean

  @Command.Array("-p,--project")
  targetProjectNames: string[] = []

  @Command.Boolean("-r,--root")
  addRootTarget: boolean = false

  @Command.Path('@pipeline')
  @Command.Path('pipeline')
  async execute(): Promise<number | void> {
    if (this.excludeDependencies === undefined) this.excludeDependencies = false;

    this.executorQueue = new PQueue({ concurrency: this.concurrency });
    this.backgroundLimitPool = new PQueue({ concurrency: this.concurrency });

    this.solution = await Solution.require(this.cwd)
    this.depMap = this.createDependencyMap();
    this.executor = this.createExecutor();
    this.marline = this.createMarline();

    const stopMarline = this.startMarline()
    try {
      let targets = [this.solution.activeProject.tag];

      if (this.targetProjectNames.length) {
        targets = this.targetProjectNames.map((i) => {
          const project = this.solution.projectsByPackageName.get(i)
          if (!project) throw new Error(`Cannot find project with name ${i}`);
          return project.tag;
        })
      }

      if (this.addRootTarget) {
        targets.push(this.solution.rootProject.tag)
      }

      await Promise.all(targets.map((target) => this.executor.execute(target)));

      Assert.equal(this.executor.queue.pending, 0, "execution.queue.pending !== 0");
      await Promise.all([
        this.backgroundError.promise,
        this.backgroundPool.onIdle().then(() => this.backgroundError.resolve()),
      ]);
    } finally {
      stopMarline()
    }

    return 0;
  }

  private solution!: Solution

  private depMap!: ReturnType<PipelineCommand['createDependencyMap']>
  private createDependencyMap() {
    const depMap = newDepMap<Tag>();

    if (!this.excludeDependencies) {
      mergeDepMap(depMap, this.solution.projectDependencyMap);
    }

    for (const project of this.solution.allProjects()) {
      mergeDepMap(depMap, project.pipelineActionDependencyMap);
    }

    return depMap;
  }

  private executor!: ReturnType<PipelineCommand['createExecutor']>
  private executorQueue!: PQueue
  private createExecutor() {
    return new DependencyExecutor(this.depMap, this.jobMapper.bind(this), this.executorQueue)
  }

  private marline!: Marline
  private createMarline() {
    const prefix = `${this.chalkStdErr.bgBlueBright.black("II")} `;

    const useFinishedJobs = createMemo((set) => {
      return Array.from(set).filter((i) => i.type === 'action')
    }, () => ([this.executor.finishedJobSet, this.executor.finishedJobSet.size] as const))

    const useTotalJobs = createMemo((map) => {
      return Array.from(map.keys()).filter((i) => i.type === 'action')
    }, () => ([this.executor.jobMap, this.executor.jobMap.size] as const))

    const useActiveJobLabels = createMemo((...jobs) => {
      return jobs.map((i) => i.toString())
    }, () => [...this.activeJobs])

    const useStatusLine = createMemo((
      finishedJobs,
      totalJobs,
      activeJobLabels,
    ) => {
      if (totalJobs.length === 0) {
        return `${prefix}starting`
      } else {
        const n1 = finishedJobs.length.toString()
        const n2 = totalJobs.length.toString()
        const percent = Math.floor(finishedJobs.length / totalJobs.length * 100).toString()
        const width = Math.max(n1.length, n2.length)
        return `${prefix}${percent.padStart(3, " ")}% (${n1.padStart(width, " ")}/${n2.padStart(width, " ")}) finished, ${activeJobLabels.length}/${this.concurrency} running`
      }
    }, () => ([
      useFinishedJobs(),
      useTotalJobs(),
      useActiveJobLabels(),
    ]) as const)

    return new Marline({
      stream: this.stderr as any,
      marginTop: 0,
      marginBottom: 1,
      render: (marline) => {
        marline.bottom.set(0, useStatusLine());
        marline.redraw()
      }
    });
  }

  private refreshMarline() {
    if (!this.marline || !this.marline.isAvailable) return;
    this.marline.refresh()
  }

  private startMarline() {
    const refresher = this.refreshMarline.bind(this)

    this.marline.start();
    const timer = this.marline.isAvailable ? setInterval(refresher, 5000) : undefined
    this.executor.addListener("jobQueued", refresher);
    this.executor.addListener("jobFinished", refresher);

    return () => {
      this.marline.stop();

      if (timer) clearInterval(timer)
      this.executor.removeListener("jobQueued", refresher);
      this.executor.removeListener("jobFinished", refresher);
    }
  }

  private backgroundOneByOnePool = new PQueue({ concurrency: 1 })
  private backgroundPool = new PQueue({ concurrency: Infinity });
  private backgroundLimitPool!: PQueue
  private backgroundError = new Defer<Error>();
  private async runInBackground(generator: () => Promise<any>) {
    await this.backgroundLimitPool.onEmpty();
    void this.backgroundLimitPool.add(() => delay(5000));
    await this.backgroundOneByOnePool.add(() => delay(1000));
    void this.backgroundPool.add(async () => {
      try {
        await generator()
      } catch (e) { this.backgroundError.reject(e) }
    });
  }

  private activeJobs = new Set<Tag>()

  private async runPipeline(project: Project, stage: PipelineStage, action: PipelineAction) {
    if (!action.stageCommands[stage]) return;
    switch (stage) {
      case PipelineStage.watch:
      case PipelineStage.dev:
        return await this.runInBackground(() => runPipelineCommand(this.taskContext, project, stage, action));
      default:
        return await runPipelineCommand(this.taskContext, project, stage, action);
    }
  }

  private async jobMapper(tag: Tag) {
    if (tag.type !== 'action') return;
    try {
      this.activeJobs.add(tag);
      this.refreshMarline();

      switch (this.stage) {
        case PipelineVirtualStage.rebuild:
        case PipelineVirtualStage.cleanbuild:
          await this.runPipeline(tag.project, PipelineStage.clean, tag.action);
          await this.runPipeline(tag.project, PipelineStage.build, tag.action);
          break;

        case PipelineStage.watch:
          await this.runPipeline(tag.project, PipelineStage.watch, tag.action);
          break;

        case PipelineVirtualStage.cleanwatch:
          await this.runPipeline(tag.project, PipelineStage.clean, tag.action);
          await this.runPipeline(tag.project, PipelineStage.build, tag.action);
          await this.runPipeline(tag.project, PipelineStage.watch, tag.action);
          break;

        case PipelineStage.dist:
          await this.runPipeline(tag.project, PipelineStage.build, tag.action);
          await this.runPipeline(tag.project, PipelineStage.dist, tag.action);
          break;

        case PipelineStage.dev:
          await this.runPipeline(tag.project, PipelineStage.dev, tag.action);
          break;

        case PipelineStage.build:
        case PipelineStage.clean:
        case PipelineStage.fix:
        case PipelineStage.lint:
          await this.runPipeline(tag.project, this.stage, tag.action);
      }
    } finally {
      this.activeJobs.delete(tag);
      this.refreshMarline();
    }
  }
}

PipelineCommand.dangerouslyRegisterDefinition(PipelineCommand.prototype, (command) => {
  command.addOption({ names: ["-j", "--jobs"], arity: 1, hidden: false });
  command.addOption({ names: Array(16).fill(0).map((_, index) => `-j${index + 1}`), arity: 0, hidden: true });
})

PipelineCommand.dangerouslyRegisterTransformer(PipelineCommand.prototype, (state, command) => {
  const cmd = command as PipelineCommand
  const auto = Math.max(1, Math.floor((cpus().length - 1) / 2));
  cmd.concurrency = auto;
  for (const { name, value } of state.options) {
    if (name === '-j' || name === '--jobs') {
      if (value === true) {
        cmd.concurrency = auto;
      } else if (value === false) {
        cmd.concurrency = 1;
      } else {
        cmd.concurrency = Math.max(1, parseInt(value, 10) || 1);
      }
    } else if (name.startsWith("-j") && value === true) {
      const num = parseInt(name.slice(2), 10)
      if (Number.isFinite(num)) {
        cmd.concurrency = Math.max(1, num || 1);
      }
    }
  }
});

PipelineCommand.dangerouslyRegisterDefinition(PipelineCommand.prototype, (command) => {
  command.addOption({ names: ["-D", "--excludeDependencies"], arity: 0, hidden: false });
  command.addOption({ names: ["-d", "--includeDependencies"], arity: 0, hidden: false });
})

PipelineCommand.dangerouslyRegisterTransformer(PipelineCommand.prototype, (state, command) => {
  const cmd = command as PipelineCommand
  for (const { name, value } of state.options) {
    if (name === '-D' || name === '--excludeDependencies') {
      cmd.excludeDependencies = value;
    } else if (name === '-d' || name === '--includeDependencies') {
      cmd.excludeDependencies = !value;
    }
  }
});

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), ms)
  })
}

async function runPipelineCommand(
  { state, execute, chalk, chalkStdErr }: TaskContext,
  project: Project,
  stage: PipelineStage,
  config: PipelineAction,
) {
  if (!config || !config.stageCommands[stage]) return;

  const prefix = (chalk: Chalk) => [
    chalk.gray("["),
    chalk.green(stage),
    chalk.yellow(project.name),
    chalk.blue(config.name),
    chalk.gray("]"), ""
  ].join(" ")

  const [stdout, stdoutEnd] = createPrefixStream(state.stdout, prefix(chalk));
  const [stderr, stderrEnd] = createPrefixStream(state.stderr, prefix(chalkStdErr));

  const commandLine = config.stageCommands[stage]!;
  stdout.write(`$ ${chalk.gray(commandLine)}\n`)
  try {
    const rc = await execute(commandLine, [], {
      cwd: project.projectRoot, stdout, stderr
    });
    if (rc) {
      stdout.write(`${chalk.redBright(`Process exited with exit code ${rc}`)}\n`)
    } else {
      stdout.write(`${chalk.gray(`Process exited clearly`)}\n`)
    }
    if (rc) throw new Error(`A command failed. CWD=${project.projectRoot} ${commandLine}`)
  } finally {
    stdout.end()
    stderr.end()
    await stdoutEnd;
    await stderrEnd;
  }
}
