import { npath } from '@yarnpkg/fslib';
import { execute } from '@yarnpkg/shell';
import { createCli, prepareShellBuiltins } from './models/Cli';
import { PipelineStage, PipelineVirtualStage } from './models/PackageManifest';
import { InvokeEntryOptions } from './utilities/TaskContext';

if (process.platform === 'win32') throw new Error('@yarnpkg/fslib has some problems with Windows paths now. DO NOT USE.')

function translateArgv(argv: string[]) {
  argv = argv.slice(0);

  if (!argv.length) argv.push("@shell");

  switch (argv[0]) {
    case undefined:
      argv.push("@shell"); break;

    case "-h":
    case "--help":
      argv[0] = "@help"; break;

    default: switch (true) {
      case Object.values(PipelineStage).includes(argv[0] as any):
      case Object.values(PipelineVirtualStage).includes(argv[0] as any):
        argv.unshift("@pipeline"); break;
    }
  }

  return argv;
}

export async function cliMain(options: InvokeEntryOptions = {}) {
  process.exit(await execute('"$@"', translateArgv(process.argv.slice(2)), {
    cwd: npath.toPortablePath(process.cwd()),
    builtins: prepareShellBuiltins(createCli(), options)
  }));
}

export function cli(options?: InvokeEntryOptions) {
  void cliMain(options)
}

if (require.main === module) cli({ invokePath: require.main.filename });