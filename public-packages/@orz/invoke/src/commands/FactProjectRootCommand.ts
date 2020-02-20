import { npath } from '@yarnpkg/fslib';
import { Project } from '../models/Project';
import { Command } from '../utilities/TaskContext';

export class FactProjectRootCommand extends Command {
  static usage = Command.Usage({
    description: `get the root path of the current project`,
  });

  @Command.Path('@fact', 'projectRoot')
  async execute(): Promise<number | void> {
    const project = await Project.fromStartingDir(this.cwd)
    if (!project?.projectRoot) return 1;
    this.log(npath.fromPortablePath(project?.projectRoot));
    return 0;
  }
}
