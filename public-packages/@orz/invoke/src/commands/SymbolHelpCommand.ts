import { Command } from '../utilities/TaskContext';

export class SymbolHelpCommand extends Command {
  static usage = Command.Usage({
    description: `list all commands`,
  });

  @Command.Path('@help')
  async execute(): Promise<number | void> {
    this.log(this.cli.usage(null))
    return 0;
  }
}
