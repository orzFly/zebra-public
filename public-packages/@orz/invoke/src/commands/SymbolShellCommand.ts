import { ShellState } from '@yarnpkg/shell';
import { CompleterResult } from 'readline';
import REPL from 'repl';
import { inspect } from 'util';
import { getAllCommandPaths } from '../models/Cli';
import { PipelineStage, PipelineVirtualStage } from '../models/PackageManifest';
import { Assert } from '../utilities/Assert';
import { mutable } from '../utilities/Mutable';
import { Command } from '../utilities/TaskContext';

function categoryCommand(cmd: string) {
  if (cmd.startsWith(".")) return "cli";
  if (cmd.startsWith("@")) return "symbol";
  return "general";
}

const NestedSymbol = Symbol()
export class SymbolShellCommand extends Command {
  static usage = Command.Usage({
    description: `start an interactive shell`,
  });

  @Command.Path('@shell')
  async execute(): Promise<number | void> {
    const input = this.taskContext.state.stdin;
    const output = this.taskContext.state.stdout;

    if (!(output as any).isTTY) throw new Error("@shell requires TTY for stdout.");
    if ((output as any)[NestedSymbol]) throw new Error("@shell cannot be nested at this moment.");
    (output as any)[NestedSymbol] = this;
    let paused = true;
    input.pause();

    try {
      let cwd = this.cwd;
      let env = Object.assign({}, this.env);
      let vars = Object.assign({}, this.vars);

      const applyState = (state: ShellState | undefined) => {
        if (!state) return;
        cwd = state.cwd;
        env = state.environment;
        vars = state.variables;
      }

      const rewriteRC = (rc: number) => {
        if (rc === 0) return undefined;
        return this.chalk.redBright(`Exit code ${rc}`);
      }

      const shouldMatch = (item: string, input: string): boolean => {
        if (input.includes(" ")) {
          return item.startsWith(input);
        }

        return (!item.includes(" ") && item.startsWith(input)) ||
          item.startsWith(`${input} `);
      }

      let matchTable: string[]
      const allHandlersBefore = output.listeners("resize");
      const repl = REPL.start({
        input: input,
        output: output,
        prompt: "INVOKE:\\> ",
        ignoreUndefined: true,
        writer: (obj: any) => {
          if (typeof obj === 'string') return obj;
          return inspect(obj, { colors: true })
        },
        completer: (line, callback) => {
          void (async (): Promise<CompleterResult> => {
            const whitespaceMatch = line.match(/^\s+/)
            let prefix = "";
            if (whitespaceMatch) {
              prefix = whitespaceMatch[0]
            }
            const cmd = line.slice(prefix.length)

            const hits = [] as string[];
            let lastMatch: string | undefined;
            for (const item of matchTable) {
              if (shouldMatch(item, cmd)) {
                if (lastMatch && categoryCommand(lastMatch) !== categoryCommand(item)) {
                  hits.push("");
                }
                hits.push(`${prefix}${item}`);
                lastMatch = item;
              }
            }
            return [hits, line];
          })()
            .then((i) => callback(null, i))
            .catch((i) => callback(i))
        },
        eval: (evalCmd, _context, _file, callback) => {
          void (async (): Promise<any> => {
            const cmd = evalCmd.trimRight()
            if (!cmd) return;
            pauseRepl();

            try {
              let capturedState: ShellState | undefined
              const magic = `@@@ shell capture ${Math.random()} @@@`
              const result = await this.taskContext.execute(`'${magic}'; ${cmd}`, [], {
                cwd: cwd,
                env: env,
                variables: vars,
                builtins: {
                  ...Object.fromEntries(this.taskContext.opts.builtins.entries()),
                  [magic]: async (_args, _opts, state) => {
                    if (!capturedState) {
                      capturedState = state;
                    } else {
                      Assert.unreachable();
                    }
                    return 0
                  }
                }
              })
              applyState(capturedState);
              return rewriteRC(result)
            } finally {
              resumeRepl();
            }
          })()
            .then((i) => callback(null, i))
            .catch((i) => callback(i, undefined))
        }
      });

      const allHandlersAfter = output.listeners("resize");
      const resizeHandlers: Array<(...args: any[]) => void> = allHandlersAfter.filter(
        (i) => !allHandlersBefore.includes(i)
      ) as any
      allHandlersAfter.length = 0;
      allHandlersBefore.length = 0;

      let replPaused = false;
      const pauseRepl = () => { repl.pause(); replPaused = true; };
      const resumeRepl = () => { repl.resume(); replPaused = false; };

      for (const handler of resizeHandlers) {
        output.removeListener("resize", handler);
        output.addListener("resize", function (this: any) {
          if (replPaused) return;
          return handler.call(this, ...arguments)
        });
      }

      const commands = mutable(repl.commands);
      delete commands.clear;
      delete commands.break;
      delete commands.load;
      delete commands.save;
      delete commands.editor;

      repl.commands.help!.action = () => {
        const names = Object.keys(repl.commands).sort();
        const longestNameLength = names.reduce(
          (max, name) => Math.max(max, name.length),
          0
        );
        output.write(`@help${' '.repeat(longestNameLength - 4 + 3)}Print a list of invoke commands\n`);
        for (const name of names) {
          const cmd = repl.commands[name]!;
          const spaces = ' '.repeat(longestNameLength - name.length + 3);
          const line = `.${name}${cmd.help ? spaces + cmd.help : ''}\n`;
          output.write(line);
        }
        output.write('\nPress ^C to abort current expression, ^D to exit the repl\n');
        repl.displayPrompt();
      }

      matchTable = [...new Set([
        ...Object.keys(repl.commands).map((i) => `.${i}`),
        ...Array.from(this.taskContext.opts.builtins.keys()),
        ...getAllCommandPaths(this.context.rootCli),
        ...[
          ...Object.values(PipelineStage),
          ...Object.values(PipelineVirtualStage)
        ].flatMap((i) => [`@pipeline ${i}`, `pipeline ${i}`])
      ])].sort();

      paused = false;
      input.resume();

      await new Promise((resolve) => {
        repl.on('exit', () => resolve())
      })
    } catch (e) {
      if (paused) input.resume();
      delete (output as any)[NestedSymbol];
    }
  }
}
