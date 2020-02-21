import { maybeWrapAsError, wrapAsOperationalError } from '../errors/OperationalError';
import { GenericPromise, getPromiseConstructor, PromiseConstructorLikeThis } from '../helpers/getPromiseConstructor';
import { notEnumerableProp } from '../helpers/notEnumerableProp';

export interface BasePromisifyOptions {
  context?: any;
}

export interface MultiArgsPromisifyOptions extends BasePromisifyOptions {
  multiArgs: true;
  errorFirst?: true | null | undefined;
}

export interface NoErrorPromisifyOptions extends BasePromisifyOptions {
  multiArgs?: false | null | undefined;
  errorFirst: false;
}

export interface MultiArgsNoErrorPromisifyOptions extends BasePromisifyOptions {
  multiArgs: true;
  errorFirst: false;
}

export interface PromisifyOptions extends BasePromisifyOptions {
  multiArgs?: boolean | null | undefined;
  errorFirst?: boolean | null | undefined;
}

const PROMISIFIED_KEY = '__isPromisified__';

/**
 * Returns a function that will wrap the given `nodeFunction`.
 *
 * Instead of taking a callback, the returned function will return a promise whose fate is decided by the callback behavior of the given node function.
 * The node function should conform to node.js convention of accepting a callback as last argument and
 * calling that callback with error as the first argument and success value on the second argument.
 *
 * If the `nodeFunction` calls its callback with multiple success values, the fulfillment value will be an array of them.
 *
 * If you pass a `receiver`, the `nodeFunction` will be called as a method on the `receiver`.
 */

export function promisify<T extends any[]>(
  func: (callback: (...result: T) => void) => void,
  options: MultiArgsNoErrorPromisifyOptions
): () => GenericPromise<T>;
export function promisify<T extends any[], A1>(
  func: (arg1: A1, callback: (...result: T) => void) => void,
  options: MultiArgsNoErrorPromisifyOptions
): (arg1: A1) => GenericPromise<T>;
export function promisify<T extends any[], A1, A2>(
  func: (arg1: A1, arg2: A2, callback: (...result: T) => void) => void,
  options: MultiArgsNoErrorPromisifyOptions
): (arg1: A1, arg2: A2) => GenericPromise<T>;
export function promisify<T extends any[], A1, A2, A3>(
  func: (arg1: A1, arg2: A2, arg3: A3, callback: (...result: T) => void) => void,
  options: MultiArgsNoErrorPromisifyOptions
): (arg1: A1, arg2: A2, arg3: A3) => GenericPromise<T>;
export function promisify<T extends any[], A1, A2, A3, A4>(
  func: (arg1: A1, arg2: A2, arg3: A3, arg4: A4, callback: (...result: T) => void) => void,
  options: MultiArgsNoErrorPromisifyOptions
): (arg1: A1, arg2: A2, arg3: A3, arg4: A4) => GenericPromise<T>;
export function promisify<T extends any[], A1, A2, A3, A4, A5>(
  func: (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5, callback: (...result: T) => void) => void,
  options: MultiArgsNoErrorPromisifyOptions
): (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5) => GenericPromise<T>;

export function promisify<T>(
  func: (callback: (result?: T) => void) => void,
  options: NoErrorPromisifyOptions
): () => GenericPromise<T>;
export function promisify<T, A1>(
  func: (arg1: A1, callback: (result?: T) => void) => void,
  options: NoErrorPromisifyOptions
): (arg1: A1) => GenericPromise<T>;
export function promisify<T, A1, A2>(
  func: (arg1: A1, arg2: A2, callback: (result?: T) => void) => void,
  options: NoErrorPromisifyOptions
): (arg1: A1, arg2: A2) => GenericPromise<T>;
export function promisify<T, A1, A2, A3>(
  func: (arg1: A1, arg2: A2, arg3: A3, callback: (result?: T) => void) => void,
  options: NoErrorPromisifyOptions
): (arg1: A1, arg2: A2, arg3: A3) => GenericPromise<T>;
export function promisify<T, A1, A2, A3, A4>(
  func: (arg1: A1, arg2: A2, arg3: A3, arg4: A4, callback: (result?: T) => void) => void,
  options: NoErrorPromisifyOptions
): (arg1: A1, arg2: A2, arg3: A3, arg4: A4) => GenericPromise<T>;
export function promisify<T, A1, A2, A3, A4, A5>(
  func: (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5, callback: (result?: T) => void) => void,
  options: NoErrorPromisifyOptions
): (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5) => GenericPromise<T>;

export function promisify<T extends any[]>(
  func: (callback: (err: any, ...result: T) => void) => void,
  options: MultiArgsPromisifyOptions
): () => GenericPromise<T>;
export function promisify<T extends any[], A1>(
  func: (arg1: A1, callback: (err: any, ...result: T) => void) => void,
  options: MultiArgsPromisifyOptions
): (arg1: A1) => GenericPromise<T>;
export function promisify<T extends any[], A1, A2>(
  func: (arg1: A1, arg2: A2, callback: (err: any, ...result: T) => void) => void,
  options: MultiArgsPromisifyOptions
): (arg1: A1, arg2: A2) => GenericPromise<T>;
export function promisify<T extends any[], A1, A2, A3>(
  func: (arg1: A1, arg2: A2, arg3: A3, callback: (err: any, ...result: T) => void) => void,
  options: MultiArgsPromisifyOptions
): (arg1: A1, arg2: A2, arg3: A3) => GenericPromise<T>;
export function promisify<T extends any[], A1, A2, A3, A4>(
  func: (arg1: A1, arg2: A2, arg3: A3, arg4: A4, callback: (err: any, ...result: T) => void) => void,
  options: MultiArgsPromisifyOptions
): (arg1: A1, arg2: A2, arg3: A3, arg4: A4) => GenericPromise<T>;
export function promisify<T extends any[], A1, A2, A3, A4, A5>(
  func: (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5, callback: (err: any, ...result: T) => void) => void,
  options: MultiArgsPromisifyOptions
): (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5) => GenericPromise<T>;

export function promisify<T>(
  func: (callback: (err: any, result?: T) => void) => void,
  options?: PromisifyOptions
): () => GenericPromise<T>;
export function promisify<T, A1>(
  func: (arg1: A1, callback: (err: any, result?: T) => void) => void,
  options?: PromisifyOptions
): (arg1: A1) => GenericPromise<T>;
export function promisify<T, A1, A2>(
  func: (arg1: A1, arg2: A2, callback: (err: any, result?: T) => void) => void,
  options?: PromisifyOptions
): (arg1: A1, arg2: A2) => GenericPromise<T>;
export function promisify<T, A1, A2, A3>(
  func: (arg1: A1, arg2: A2, arg3: A3, callback: (err: any, result?: T) => void) => void,
  options?: PromisifyOptions
): (arg1: A1, arg2: A2, arg3: A3) => GenericPromise<T>;
export function promisify<T, A1, A2, A3, A4>(
  func: (arg1: A1, arg2: A2, arg3: A3, arg4: A4, callback: (err: any, result?: T) => void) => void,
  options?: PromisifyOptions
): (arg1: A1, arg2: A2, arg3: A3, arg4: A4) => GenericPromise<T>;
export function promisify<T, A1, A2, A3, A4, A5>(
  func: (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5, callback: (err: any, result?: T) => void) => void,
  options?: PromisifyOptions
): (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5) => GenericPromise<T>;

export function promisify(
  this: PromiseConstructorLikeThis,
  func: (...args: any[]) => void,
  options: PromisifyOptions = {}
): (...args: any[]) => GenericPromise<any> {
  if ((func as any)[PROMISIFIED_KEY]) return func as any;

  const Promise = getPromiseConstructor(this);
  const context = options.context
  const multiArgs = options.multiArgs === true ? true : false;
  const errorFirst = multiArgs ? options.errorFirst === true : options.errorFirst !== false

  const result = function promisifiedFunction(this: any, ...args: any[]) {
    return new Promise((resolve, reject) => {
      if (multiArgs === true) {
        args.push((...result: any[]) => {
          if (errorFirst !== true) {
            if (result[0]) {
              reject(wrapAsOperationalError(maybeWrapAsError(result[0])));
            } else {
              result.shift();
              resolve(Promise.all(result));
            }
          } else {
            resolve(Promise.all(result));
          }
        });
      } else if (errorFirst !== false) {
        args.push((error: any, result: any) => {
          if (error) {
            reject(wrapAsOperationalError(maybeWrapAsError(error)));
          } else {
            resolve(result);
          }
        });
      } else {
        args.push(resolve);
      }

      func.apply(context === undefined ? this : context, args);
    });
  };
  notEnumerableProp(result, PROMISIFIED_KEY, true);

  try {
    if (func.name) {
      Object.defineProperty(result, 'name', {
        value: func.name + 'Async',
        writable: false,
        enumerable: false,
        configurable: true
      })
    }
  } catch (e) { }

  try {
    Object.defineProperty(result, 'length', {
      value: func.length > 1 ? (func.length - 1) : 0,
      writable: false,
      enumerable: false,
      configurable: true
    })
  } catch (e) { }

  return result;
}
