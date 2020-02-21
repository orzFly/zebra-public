import { Resolvable } from '../helpers/types';
import { GenericPromise, getPromiseConstructor } from '../helpers/getPromiseConstructor';

/**
 * Promise.join(
 *   Promise<any>|any values...,
 *   function handler
 * ) -> Promise
 * For coordinating multiple concurrent discrete promises.
 *
 * Note: In 1.x and 0.x Promise.join used to be a Promise.all that took the values in as arguments instead in an array.
 * This behavior has been deprecated but is still supported partially - when the last argument is an immediate function value the new semantics will apply
 */
export function join<R, A1>(
  arg1: Resolvable<A1>,
  handler: (arg1: A1) => Resolvable<R>
): GenericPromise<R>;
export function join<R, A1, A2>(
  arg1: Resolvable<A1>,
  arg2: Resolvable<A2>,
  handler: (arg1: A1, arg2: A2) => Resolvable<R>
): GenericPromise<R>;
export function join<R, A1, A2, A3>(
  arg1: Resolvable<A1>,
  arg2: Resolvable<A2>,
  arg3: Resolvable<A3>,
  handler: (arg1: A1, arg2: A2, arg3: A3) => Resolvable<R>
): GenericPromise<R>;
export function join<R, A1, A2, A3, A4>(
  arg1: Resolvable<A1>,
  arg2: Resolvable<A2>,
  arg3: Resolvable<A3>,
  arg4: Resolvable<A4>,
  handler: (arg1: A1, arg2: A2, arg3: A3, arg4: A4) => Resolvable<R>
): GenericPromise<R>;
export function join<R, A1, A2, A3, A4, A5>(
  arg1: Resolvable<A1>,
  arg2: Resolvable<A2>,
  arg3: Resolvable<A3>,
  arg4: Resolvable<A4>,
  arg5: Resolvable<A5>,
  handler: (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5) => Resolvable<R>
): GenericPromise<R>;

/** @deprecated use .all instead */
export function join<R>(...values: Array<Resolvable<R>>): GenericPromise<R[]>;

export function join<R>(...args: Array<Resolvable<R>>): GenericPromise<R[]> {
  const Promise = getPromiseConstructor(this);

  const last = args.length - 1;
  if (last > 0 && typeof args[last] === "function") {
    const fn = args.pop() as unknown as Function;
    return Promise.all(args).then(function joinSpreadOnFulfilled(val) {
      return fn(...val);
    });
  }
  return Promise.all(args);
};