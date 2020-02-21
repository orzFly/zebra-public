import { promisify } from 'navybird/src/functions/promisify';
import { expectType, expectError } from 'tsd';

const target = (a: string, b: number, c: boolean, d: "so", e: "ni", cb: (err: Error, result: string, result2: number) => void) => true

expectType<(arg1: string, arg2: number, arg3: boolean, arg4: "so", arg5: "ni") => Promise<string>>(promisify(target))
expectType<(arg1: string, arg2: number, arg3: boolean, arg4: "so", arg5: "ni") => Promise<string>>(promisify(target, {}))
expectType<(arg1: string, arg2: number, arg3: boolean, arg4: "so", arg5: "ni") => Promise<string>>(promisify(target, { context: 1 }))
expectType<(arg1: string, arg2: number, arg3: boolean, arg4: "so", arg5: "ni") => Promise<string>>(promisify(target, { errorFirst: true }))
expectType<(arg1: string, arg2: number, arg3: boolean, arg4: "so", arg5: "ni") => Promise<string>>(promisify(target, { errorFirst: undefined }))
expectType<(arg1: string, arg2: number, arg3: boolean, arg4: "so", arg5: "ni") => Promise<string>>(promisify(target, { multiArgs: false }))
expectType<(arg1: string, arg2: number, arg3: boolean, arg4: "so", arg5: "ni") => Promise<string>>(promisify(target, { multiArgs: undefined }))
expectType<(arg1: string, arg2: number, arg3: boolean, arg4: "so", arg5: "ni") => Promise<string>>(promisify(target, { errorFirst: true, multiArgs: false }))
expectType<(arg1: string, arg2: number, arg3: boolean, arg4: "so", arg5: "ni") => Promise<string>>(promisify(target, { errorFirst: true, multiArgs: undefined }))
expectType<(arg1: string, arg2: number, arg3: boolean, arg4: "so", arg5: "ni") => Promise<string>>(promisify(target, { errorFirst: undefined, multiArgs: false }))
expectType<(arg1: string, arg2: number, arg3: boolean, arg4: "so", arg5: "ni") => Promise<string>>(promisify(target, { errorFirst: undefined, multiArgs: undefined }))

expectError<(arg1: string, arg2: number, arg3: boolean, arg4: "so", arg5: "ni") => Promise<boolean>>(promisify(target))
expectError<(arg1: string, arg2: number, arg3: boolean, arg4: "so", arg5: "ni") => Promise<boolean>>(promisify(target, {}))
expectError<(arg1: string, arg2: number, arg3: boolean, arg4: "so", arg5: "ni") => Promise<boolean>>(promisify(target, { context: 1 }))
expectError<(arg1: string, arg2: number, arg3: boolean, arg4: "so", arg5: "ni") => Promise<boolean>>(promisify(target, { errorFirst: true }))
expectError<(arg1: string, arg2: number, arg3: boolean, arg4: "so", arg5: "ni") => Promise<boolean>>(promisify(target, { errorFirst: undefined }))
expectError<(arg1: string, arg2: number, arg3: boolean, arg4: "so", arg5: "ni") => Promise<boolean>>(promisify(target, { multiArgs: false }))
expectError<(arg1: string, arg2: number, arg3: boolean, arg4: "so", arg5: "ni") => Promise<boolean>>(promisify(target, { multiArgs: undefined }))
expectError<(arg1: string, arg2: number, arg3: boolean, arg4: "so", arg5: "ni") => Promise<boolean>>(promisify(target, { errorFirst: true, multiArgs: false }))
expectError<(arg1: string, arg2: number, arg3: boolean, arg4: "so", arg5: "ni") => Promise<boolean>>(promisify(target, { errorFirst: true, multiArgs: undefined }))
expectError<(arg1: string, arg2: number, arg3: boolean, arg4: "so", arg5: "ni") => Promise<boolean>>(promisify(target, { errorFirst: undefined, multiArgs: false }))
expectError<(arg1: string, arg2: number, arg3: boolean, arg4: "so", arg5: "ni") => Promise<boolean>>(promisify(target, { errorFirst: undefined, multiArgs: undefined }))

expectType<(arg1: string, arg2: number, arg3: boolean, arg4: "so", arg5: "ni") => Promise<[string, number]>>(promisify(target, { multiArgs: true }))
expectType<(arg1: string, arg2: number, arg3: boolean, arg4: "so", arg5: "ni") => Promise<[string, number]>>(promisify(target, { multiArgs: true, errorFirst: true }))
expectType<(arg1: string, arg2: number, arg3: boolean, arg4: "so", arg5: "ni") => Promise<string>>(promisify(target, { multiArgs: false }))

expectType<(arg1: string, arg2: number, arg3: boolean, arg4: "so", arg5: "ni") => Promise<string>>(promisify(target, { errorFirst: true }))
expectType<(arg1: string, arg2: number, arg3: boolean, arg4: "so", arg5: "ni") => Promise<Error>>(promisify(target, { errorFirst: false }))

expectType<(arg1: string, arg2: number, arg3: boolean, arg4: "so", arg5: "ni") => Promise<[Error, string, number]>>(promisify(target, { multiArgs: true, errorFirst: false }))
