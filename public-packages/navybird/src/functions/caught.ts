import { GenericPromise } from '../helpers/getPromiseConstructor';
import { PromiseLikeValueType } from '../helpers/types';
import { caughtHandlerFactory } from './caughtHandlerFactory';

export type CatchFilter<E> =
  | (new (...args: any[]) => E)
  | ((error: E) => boolean | PromiseLike<boolean>)
  | RegExp
  | (object & E);

/**
 * This is a catch-all exception handler, shortcut for calling `.then(null, handler)` on this promise.
 *
 * Any exception happening in a `.then`-chain will propagate to nearest `.catch` handler.
 *
 * Alias `.caught();` for compatibility with earlier ECMAScript version.
 */
export function caught<P extends PromiseLike<any>>(
  promise: P,
  onReject: (error: any) => PromiseLikeValueType<P> | PromiseLike<PromiseLikeValueType<P>>
): GenericPromise<PromiseLikeValueType<P>>;
export function caught<P extends PromiseLike<any>, U>(
  promise: P,
  onReject: ((error: any) => U | PromiseLike<U>) | undefined | null
): GenericPromise<U | PromiseLikeValueType<P>>;

/**
 * This extends `.catch` to work more like catch-clauses in languages like Java or C#.
 *
 * Instead of manually checking `instanceof` or `.name === "SomeError"`,
 * you may specify a number of error constructors which are eligible for this catch handler.
 * The catch handler that is first met that has eligible constructors specified, is the one that will be called.
 *
 * This method also supports predicate-based filters.
 * If you pass a predicate function instead of an error constructor, the predicate will receive the error as an argument.
 * The return result of the predicate will be used determine whether the error handler should be called.
 *
 * Alias `.caught();` for compatibility with earlier ECMAScript version.
 */
export function caught<P extends PromiseLike<any>, E1, E2, E3, E4, E5>(
  promise: P,
  filter1: CatchFilter<E1>,
  filter2: CatchFilter<E2>,
  filter3: CatchFilter<E3>,
  filter4: CatchFilter<E4>,
  filter5: CatchFilter<E5>,
  onReject: (error: E1 | E2 | E3 | E4 | E5) => PromiseLikeValueType<P> | PromiseLike<PromiseLikeValueType<P>>
): GenericPromise<PromiseLikeValueType<P>>;
export function caught<P extends PromiseLike<any>, U, E1, E2, E3, E4, E5>(
  promise: P,
  filter1: CatchFilter<E1>,
  filter2: CatchFilter<E2>,
  filter3: CatchFilter<E3>,
  filter4: CatchFilter<E4>,
  filter5: CatchFilter<E5>,
  onReject: (error: E1 | E2 | E3 | E4 | E5) => U | PromiseLike<U>
): GenericPromise<U | PromiseLikeValueType<P>>;

export function caught<P extends PromiseLike<any>, E1, E2, E3, E4>(
  promise: P,
  filter1: CatchFilter<E1>,
  filter2: CatchFilter<E2>,
  filter3: CatchFilter<E3>,
  filter4: CatchFilter<E4>,
  onReject: (error: E1 | E2 | E3 | E4) => PromiseLikeValueType<P> | PromiseLike<PromiseLikeValueType<P>>
): GenericPromise<PromiseLikeValueType<P>>;

export function caught<P extends PromiseLike<any>, U, E1, E2, E3, E4>(
  promise: P,
  filter1: CatchFilter<E1>,
  filter2: CatchFilter<E2>,
  filter3: CatchFilter<E3>,
  filter4: CatchFilter<E4>,
  onReject: (error: E1 | E2 | E3 | E4) => U | PromiseLike<U>
): GenericPromise<U | PromiseLikeValueType<P>>;

export function caught<P extends PromiseLike<any>, E1, E2, E3>(
  promise: P,
  filter1: CatchFilter<E1>,
  filter2: CatchFilter<E2>,
  filter3: CatchFilter<E3>,
  onReject: (error: E1 | E2 | E3) => PromiseLikeValueType<P> | PromiseLike<PromiseLikeValueType<P>>
): GenericPromise<PromiseLikeValueType<P>>;
export function caught<P extends PromiseLike<any>, U, E1, E2, E3>(
  promise: P,
  filter1: CatchFilter<E1>,
  filter2: CatchFilter<E2>,
  filter3: CatchFilter<E3>,
  onReject: (error: E1 | E2 | E3) => U | PromiseLike<U>
): GenericPromise<U | PromiseLikeValueType<P>>;

export function caught<P extends PromiseLike<any>, E1, E2>(
  promise: P,
  filter1: CatchFilter<E1>,
  filter2: CatchFilter<E2>,
  onReject: (error: E1 | E2) => PromiseLikeValueType<P> | PromiseLike<PromiseLikeValueType<P>>
): GenericPromise<PromiseLikeValueType<P>>;
export function caught<P extends PromiseLike<any>, U, E1, E2>(
  promise: P,
  filter1: CatchFilter<E1>,
  filter2: CatchFilter<E2>,
  onReject: (error: E1 | E2) => U | PromiseLike<U>
): GenericPromise<U | PromiseLikeValueType<P>>;

export function caught<P extends PromiseLike<any>, E1>(
  promise: P,
  filter1: CatchFilter<E1>,
  onReject: (error: E1) => PromiseLikeValueType<P> | PromiseLike<PromiseLikeValueType<P>>
): GenericPromise<PromiseLikeValueType<P>>;
export function caught<P extends PromiseLike<any>, U, E1>(
  promise: P,
  filter1: CatchFilter<E1>,
  onReject: (error: E1) => U | PromiseLike<U>
): GenericPromise<U | PromiseLikeValueType<P>>;

export function caught(
  promise: Promise<any>,
  ...args: any[]
): Promise<any> {
  return promise.then(undefined, caughtHandlerFactory(args));
};
