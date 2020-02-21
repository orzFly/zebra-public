import { GenericPromise } from '../helpers/getPromiseConstructor';
import { PromiseLikeValueType } from '../helpers/types';
import { CatchFilter } from './caught';
import { caughtHandlerFactory } from './caughtHandlerFactory';

/**
 * Convenience method for:
 *
 * <code>
 * .catch(function() {
 *    throw reason;
 * });
 * </code>
 * Same limitations apply as with `.catchReturn()`.
 */
export function catchThrow<P extends PromiseLike<any>>(
  promise: P,
  reason: Error
): GenericPromise<PromiseLikeValueType<P>>;

// No need to be specific about Error types in these overrides, since there's no handler function
export function catchThrow<P extends PromiseLike<any>>(
  promise: P,
  filter1: CatchFilter<Error>,
  filter2: CatchFilter<Error>,
  filter3: CatchFilter<Error>,
  filter4: CatchFilter<Error>,
  filter5: CatchFilter<Error>,
  reason: Error
): GenericPromise<PromiseLikeValueType<P>>;
export function catchThrow<P extends PromiseLike<any>>(
  promise: P,
  filter1: CatchFilter<Error>,
  filter2: CatchFilter<Error>,
  filter3: CatchFilter<Error>,
  filter4: CatchFilter<Error>,
  reason: Error
): GenericPromise<PromiseLikeValueType<P>>;
export function catchThrow<P extends PromiseLike<any>>(
  promise: P,
  filter1: CatchFilter<Error>,
  filter2: CatchFilter<Error>,
  filter3: CatchFilter<Error>,
  reason: Error
): GenericPromise<PromiseLikeValueType<P>>;
export function catchThrow<P extends PromiseLike<any>>(
  promise: P,
  filter1: CatchFilter<Error>,
  filter2: CatchFilter<Error>,
  reason: Error
): GenericPromise<PromiseLikeValueType<P>>;
export function catchThrow<P extends PromiseLike<any>>(
  promise: P,
  filter1: CatchFilter<Error>,
  reason: Error
): GenericPromise<PromiseLikeValueType<P>>;

export function catchThrow(
  promise: Promise<any>,
  ...args: any[]
): Promise<any> {
  return promise.then(undefined, caughtHandlerFactory(args, catchThrowHandleFactory));
};

function catchThrowHandleFactory(reason: any) {
  return function catchThrowReason() {
    throw reason;
  };
};