import { Command } from '../utilities/TaskContext';

export class SymbolEvalCommand extends Command {
  static usage = Command.Usage({
    description: `eval shell script`,
  });

  @Command.String({ required: true })
  source!: string

  @Command.Proxy()
  args: string[] = [];

  @Command.Path('@eval')
  async execute(): Promise<number | void> {
    return await this.taskContext.execute(this.source, this.args);
  }
}
