import * as NSImport from 'navybird';
import DefaultImport, { name as namedName, Navybird as NamedImport } from 'navybird';
import { expectType } from 'tsd';

expectType<string>(NSImport.name)
expectType<string>(NamedImport.name)
expectType<string>(DefaultImport.name)
expectType<string>(namedName)

expectType<NSImport.Navybird<string>>(NSImport.resolve("string"))
expectType<NamedImport<string>>(NamedImport.resolve("string"))
// expectError<DefaultImport<string>>(DefaultImport.resolve("string"))
