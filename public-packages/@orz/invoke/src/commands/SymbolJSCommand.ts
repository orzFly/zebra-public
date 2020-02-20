import { npath } from '@yarnpkg/fslib';
import nativeModule from 'module';
import { Command } from '../utilities/TaskContext';

export class SymbolJSCommand extends Command {
  static usage = Command.Usage({
    description: `eval JavaScript script`,
  });

  @Command.String({ required: true })
  source!: string

  @Command.Proxy()
  args: string[] = [];

  @Command.Path('@js')
  async execute(): Promise<number | void> {
    const func = (0, eval)(`(async function({ require, args, console, log, env, vars }) {\n${this.source}\n})`)
    const require = nativeModule.createRequire(npath.resolve(npath.fromPortablePath(this.cwd), "__invoke_@js_eval__.js"))
    const result = await func({
      require,
      args: [this.source, ...this.args],
      console: this.console,
      log: this.log,
      env: this.env,
      vars: this.vars,
    })

    if (typeof result === 'number') return result
    if (result === false) return -1;
    return 0
  }
}
