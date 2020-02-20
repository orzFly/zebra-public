import { AssertFactory, createAssert } from '@orz/assert-factory';

export const Assert: AssertFactory<ErrorConstructor> = createAssert(Error);