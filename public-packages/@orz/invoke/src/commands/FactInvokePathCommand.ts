
import { Command } from '../utilities/TaskContext';

export class FactInvokePathCommand extends Command {
  static usage = Command.Usage({
    description: `get the path of the main invoke library`,
  });

  @Command.Path('@fact', 'invokePath')
  async execute(): Promise<number | void> {
    if (!this.entryOptions.invokePath) return 1;
    this.log(this.entryOptions.invokePath);
    return 0;
  }
}
