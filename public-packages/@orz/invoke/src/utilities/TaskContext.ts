import { execute, ShellBuiltin, ShellOptions, ShellState, UserOptions } from "@yarnpkg/shell";
import chalk from 'chalk';
import { BaseContext, Command as ClipanionCommand } from "clipanion";
import { Cli, CliContext } from "clipanion/lib/advanced/Cli";
import { CommandBuilder, RunState } from "clipanion/lib/core";
import { Writable } from "stream";
import { inspect } from "util";
import { supportsColor } from "./supportsColor";

export interface InvokeEntryOptions {
  invokePath?: string
}

function writeLogToStream({
  stream,
  args,
  colors = false
}: {
  stream: Writable;
  args: any[];
  colors?: boolean
  }): void {
  (<any>global).shit = stream;
  if (args.length === 0) return void stream.write("\n");
  if (args.length === 1 && typeof args[0] === 'string') {
    return void stream.write(`${args[0]}\n`)
  }

  const result = args.map((i) => {
    if (typeof i === 'string') return i
    return inspect(i, { colors })
  })
  stream.write(`${result.join(" ")}\n`);
}

export class TaskContext {
  constructor(
    readonly args: Array<string>,
    readonly opts: ShellOptions,
    readonly state: ShellState
  ) { }

  log(message?: any, ...optionalParams: any[]): void
  log(...args: any[]) { writeLogToStream({ stream: this.state.stdout, colors: this.supportsColor > 0, args }) }

  info(message?: any, ...optionalParams: any[]): void
  info(...args: any[]) { writeLogToStream({ stream: this.state.stdout, colors: this.supportsColor > 0, args }) }

  debug(message?: any, ...optionalParams: any[]): void
  debug(...args: any[]) { writeLogToStream({ stream: this.state.stdout, colors: this.supportsColorStdErr > 0, args }) }

  error(message?: any, ...optionalParams: any[]): void
  error(...args: any[]) { writeLogToStream({ stream: this.state.stderr, colors: this.supportsColorStdErr > 0, args }) }

  warn(message?: any, ...optionalParams: any[]): void
  warn(...args: any[]) { writeLogToStream({ stream: this.state.stderr, args }) }

  get console() {
    return {
      log: this.log,
      info: this.info,
      debug: this.debug,
      error: this.error,
      warn: this.warn,
    }
  }

  get supportsColor() {
    return supportsColor({
      haveStream: !!this.state.stdout,
      streamIsTTY: this.state.stdout && (<any>this.state.stdout).isTTY,
      env: this.state.environment
    })
  }

  get supportsColorStdErr() {
    return supportsColor({
      haveStream: !!this.state.stderr,
      streamIsTTY: this.state.stderr && (<any>this.state.stderr).isTTY,
      env: this.state.environment
    })
  }

  get chalk() {
    return new chalk.Instance({ level: this.supportsColor })
  }

  get chalkStdErr() {
    return new chalk.Instance({ level: this.supportsColorStdErr })
  }

  async execute(cmd: string, args?: string[], opts?: Partial<UserOptions>) {
    return await execute(cmd, args, {
      builtins: Object.fromEntries(this.opts.builtins.entries()),
      cwd: this.state.cwd,
      env: this.state.environment,
      variables: this.state.variables,
      stdin: this.state.stdin,
      stdout: this.state.stdout,
      stderr: this.state.stderr,
      ...opts
    })
  }
}

for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(TaskContext.prototype))) {
  if (descriptor.value && typeof descriptor.value === 'function') {
    const value = descriptor.value
    Object.defineProperty(TaskContext.prototype, key, {
      configurable: true,
      enumerable: false,
      get: function () {
        const bound = value.bind(this)
        try {
          Object.defineProperty(this, key, {
            configurable: true,
            enumerable: false,
            value: bound
          })
        } catch (e) { }
        return bound
      }
    })
  } else if (descriptor.get) {
    const get = descriptor.get;
    Object.defineProperty(TaskContext.prototype, key, {
      configurable: true,
      enumerable: false,
      get: function () {
        const value = get.apply(this)
        try {
          Object.defineProperty(this, key, {
            configurable: true,
            enumerable: false,
            value: value
          })
        } catch (e) { }
        return value
      }
    })
  }
}

export interface InvokeContext extends BaseContext {
  taskContext: TaskContext
  entryOptions: InvokeEntryOptions
  rootCli: Cli<InvokeContext>
}

export abstract class Command extends ClipanionCommand<InvokeContext> {
  get taskContext() { return this.context.taskContext; }
  get stdout() { return this.taskContext.state.stdout; }
  get stderr() { return this.taskContext.state.stderr; }
  get chalk() { return this.taskContext.chalk; }
  get chalkStdErr() { return this.taskContext.chalkStdErr; }
  get console() { return this.taskContext.console; }
  get log() { return this.taskContext.log; }
  get cwd() { return this.taskContext.state.cwd; }
  get env() { return this.taskContext.state.environment; }
  get vars() { return this.taskContext.state.variables; }
  get entryOptions() { return this.context.entryOptions; }

  static dangerouslyRegisterDefinition(prototype: Command, definition: (command: CommandBuilder<CliContext<InvokeContext>>) => void) {
    this.getMeta(prototype).definitions.push(definition);
  }

  static dangerouslyRegisterTransformer<T extends Command>(prototype: T, transformer: (state: RunState, command: T) => void) {
    this.getMeta(prototype).transformers.push(transformer as any);
  }
}

export function task(main: (ctx: TaskContext) => Promise<number>): ShellBuiltin {
  return async (args, opts, state) => {
    const ctx = new TaskContext(args, opts, state)
    try {
      return await main(ctx);
    } catch (e) {
      // XXX: In fact, this is already handled by Clipanion.
      //      Expect no errors here!
      ctx.error(e);
      return 1;
    }
  }
}
