import { ShellBuiltin } from '@yarnpkg/shell';
import { Cli } from 'clipanion';
import { getCommands } from '../commands';
import { InvokeContext, InvokeEntryOptions, task } from '../utilities/TaskContext';

if (process.platform === 'win32') throw new Error('@yarnpkg/fslib has some problems with Windows paths now. DO NOT USE.')
export function createCli() {
  const cli = new Cli<InvokeContext>({
    binaryName: "[invoke]",
  });

  for (const klass of getCommands()) {
    cli.register(klass);
  }
  return cli;
}

export function getAllCommandPaths(cli: Cli<any>) {
  const cliPrivate = cli as any
  const commands = new Set<string>();
  for (const [, number] of cliPrivate.registrations) {
    const builder = cliPrivate.builder.getBuilderByIndex(number)

    const paths = builder.paths as string[][]
    if (!paths.length) continue;

    for (const path of paths) commands.add(path.join(" "))
  }
  return commands;
}
function getTopLevelCommands(cli: Cli<any>) {
  const cliPrivate = cli as any
  const commands = new Set<string>();
  for (const [, number] of cliPrivate.registrations) {
    const builder = cliPrivate.builder.getBuilderByIndex(number)

    const paths = builder.paths as string[][]
    if (!paths.length) continue;

    const stubs = paths.map((i) => i[0]).filter((i) => !!i)
    commands.add(stubs[0])
    for (const stub of stubs) if (stub.startsWith("@")) commands.add(stub)
  }
  return commands;
}

export function prepareShellBuiltins(cli: Cli<InvokeContext>, entryOptions: InvokeEntryOptions) {
  const commands = getTopLevelCommands(cli);
  const cliBuiltins = new Map<string, ShellBuiltin>();
  for (const command of commands) {
    cliBuiltins.set(command, task(async (ctx) => {
      return await cli.run([command, ...ctx.args], {
        stderr: ctx.state.stderr,
        stdin: ctx.state.stdin,
        stdout: ctx.state.stdout,
        taskContext: ctx,
        entryOptions,
        rootCli: cli,
      })
    }))
  }
  return Object.fromEntries(cliBuiltins.entries());
}