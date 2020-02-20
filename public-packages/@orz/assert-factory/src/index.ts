type Args1<T> = T extends new (arg0: any, ...args: infer R) => any ? R : never
type AssertFactoryError = new (code: string, ...args: any[]) => Error

class AssertFactoryBase<E extends AssertFactoryError> {
  public error!: E

  isTruthy(condition: any, code: string, ...args: Args1<E>): asserts condition {
    if (!condition) throw new this.error(code, ...args);
  }

  isFalsy(condition: any, code: string, ...args: Args1<E>): asserts condition is null | undefined | 0 | "" | false {
    if (condition) throw new this.error(code, ...args);
  }

  isUndefined(condition: any, code: string, ...args: Args1<E>): asserts condition is undefined {
    if (condition !== undefined) throw new this.error(code, ...args);
  }

  isNull(condition: any, code: string, ...args: Args1<E>): asserts condition is null {
    if (condition !== null) throw new this.error(code, ...args);
  }

  hasNoValue(condition: any, code: string, ...args: Args1<E>): asserts condition is null | undefined {
    if (condition !== null && condition !== undefined) throw new this.error(code, ...args);
  }

  isNotUndefined<T>(condition: T, code: string, ...args: Args1<E>): asserts condition is Exclude<T, undefined> {
    if (condition === undefined) throw new this.error(code, ...args);
  }

  isNotNull<T>(condition: T, code: string, ...args: Args1<E>): asserts condition is Exclude<T, null> {
    if (condition === null) throw new this.error(code, ...args);
  }

  hasValue<T>(condition: T, code: string, ...args: Args1<E>): asserts condition is NonNullable<T> {
    if (condition === null || condition === undefined) throw new this.error(code, ...args);
  }

  isTrue(condition: boolean, code: string, ...args: Args1<E>): asserts condition is true {
    if (condition !== true) throw new this.error(code, ...args);
  }

  isFalse(condition: boolean, code: string, ...args: Args1<E>): asserts condition is false {
    if (condition !== false) throw new this.error(code, ...args);
  }

  equal<T>(actual: T, expected: T, code: string, ...args: Args1<E>) {
    if (actual !== expected) throw new this.error(code, ...args);
  }

  notEqual<T>(actual: T, notExpected: T, code: string, ...args: Args1<E>) {
    if (actual === notExpected) throw new this.error(code, ...args);
  }

  lte<T>(actual: T, expectedMax: T, code: string, ...args: Args1<E>) {
    if (!(actual <= expectedMax)) throw new this.error(code, ...args);
  }

  max<T>(actual: T, expectedMax: T, code: string, ...args: Args1<E>) {
    if (!(actual <= expectedMax)) throw new this.error(code, ...args);
  }

  gte<T>(actual: T, expectedMin: T, code: string, ...args: Args1<E>) {
    if (!(actual >= expectedMin)) throw new this.error(code, ...args);
  }

  min<T>(actual: T, expectedMin: T, code: string, ...args: Args1<E>) {
    if (!(actual >= expectedMin)) throw new this.error(code, ...args);
  }

  lt<T>(actual: T, expectedMax: T, code: string, ...args: Args1<E>) {
    if (!(actual < expectedMax)) throw new this.error(code, ...args);
  }

  gt<T>(actual: T, expectedMin: T, code: string, ...args: Args1<E>) {
    if (!(actual > expectedMin)) throw new this.error(code, ...args);
  }

  unreachable(code: string = "unreachable", ...args: Args1<E>): never {
    throw new this.error(code, ...args);
  }

  throw(code: string = "throw", ...args: Args1<E>): never {
    throw new this.error(code, ...args);
  }

  isNumber(value: any, code: string, ...args: Args1<E>): asserts value is number {
    if (typeof value !== 'number') throw new this.error(code, ...args);
  }

  isFinite(value: number, code: string, ...args: Args1<E>) {
    if (!Number.isFinite(value)) throw new this.error(code, ...args);
  }

  isInteger(value: number, code: string, ...args: Args1<E>) {
    if (!Number.isInteger(value)) throw new this.error(code, ...args);
  }

  isSafeInteger(value: number, code: string, ...args: Args1<E>) {
    if (!Number.isSafeInteger(value)) throw new this.error(code, ...args);
  }

  isNaN(value: number, code: string, ...args: Args1<E>) {
    if (!Number.isNaN(value)) throw new this.error(code, ...args);
  }

  isString(value: any, code: string, ...args: Args1<E>): asserts value is string {
    if (typeof value !== 'string') throw new this.error(code, ...args);
  }
}

type AssertFactoryConstructor<E extends AssertFactoryError> = {
  (condition: any, code: string, ...args: Args1<E>): asserts condition

  new(code: string, ...args: Args1<E>): InstanceType<E>
}

export type AssertFactory<E extends AssertFactoryError> = AssertFactoryConstructor<E> & AssertFactoryBase<E>;

export function createAssert<E extends AssertFactoryError>(error: E): AssertFactory<E> {
  const constructor: AssertFactory<E> = function (this: any, condition: any, code: string, ...args: Args1<E>) {
    if (this && this instanceof constructor) {
      const err = new (error as any)(...arguments);
      Error.captureStackTrace(err, constructor);
      return err;
    }

    return AssertFactoryBase.prototype.isTruthy.call(constructor, condition, code, ...args);
  } as any

  constructor.error = error;

  const prototype = AssertFactoryBase.prototype;
  for (const methodName of Object.getOwnPropertyNames(prototype) as Array<keyof typeof prototype>) {
    constructor[methodName] = prototype[methodName];
  }

  return constructor
}
