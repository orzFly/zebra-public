import { Project } from '../models/Project';
import { Command } from '../utilities/TaskContext';

export class FactProjectNameCommand extends Command {
  static usage = Command.Usage({
    description: `get the package name of the current project`,
  });

  @Command.Path('@fact', 'projectName')
  async execute(): Promise<number | void> {
    const project = await Project.fromStartingDir(this.cwd)
    if (!project?.packageName) return 1;
    this.log(project?.packageName);
    return 0;
  }
}
