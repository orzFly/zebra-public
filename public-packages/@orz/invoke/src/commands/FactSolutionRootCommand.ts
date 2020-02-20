
import { npath } from '@yarnpkg/fslib';
import { Solution } from '../models/Solution';
import { Command } from '../utilities/TaskContext';

export class FactSolutionRootCommand extends Command {
  static usage = Command.Usage({
    description: `get the root path of the current solution`,
  });

  @Command.Path('@fact', 'solutionRoot')
  async execute(): Promise<number | void> {
    const solution = await Solution.setup(this.cwd)
    if (!solution?.solutionRoot) return 1;
    this.log(npath.fromPortablePath(solution?.solutionRoot));
    return 0;
  }
}
