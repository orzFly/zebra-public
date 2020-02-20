import { ArchiveCommand } from "./ArchiveCommand";
import { CollectDistCommand } from "./CollectDistCommand";
import { ExtractLockFileCommand } from "./ExtractLockFileCommand";
import { FactInvokePathCommand } from "./FactInvokePathCommand";
import { FactProjectNameCommand } from "./FactProjectNameCommand";
import { FactProjectRootCommand } from "./FactProjectRootCommand";
import { FactSolutionRootCommand } from "./FactSolutionRootCommand";
import { PipelineCommand } from "./PipelineCommand";
import { SymbolEvalCommand } from "./SymbolEvalCommand";
import { SymbolHelpCommand } from "./SymbolHelpCommand";
import { SymbolJSCommand } from "./SymbolJSCommand";
import { SymbolShellCommand } from "./SymbolShellCommand";

export function getCommands() {
  return [
    ArchiveCommand,
    PipelineCommand,
    CollectDistCommand,
    ExtractLockFileCommand,

    SymbolShellCommand,
    SymbolHelpCommand,
    SymbolEvalCommand,
    SymbolJSCommand,

    FactInvokePathCommand,
    FactSolutionRootCommand,
    FactProjectRootCommand,
    FactProjectNameCommand,
  ]
}
