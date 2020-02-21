import { GenericPromise } from '../helpers/getPromiseConstructor';
import { PromiseLikeValueType } from '../helpers/types';
import { CatchFilter } from './caught';
import { caughtHandlerFactory } from './caughtHandlerFactory';

/**
 * Convenience method for:
 *
 * <code>
 * .catch(function() {
 *    return value;
 * });
 * </code>
 *
 * in the case where `value` doesn't change its value. That means `value` is bound at the time of calling `.catchReturn()`
 */
export function catchReturn<P extends PromiseLike<any>, U>(
  promise: P,
  value: U
): GenericPromise<PromiseLikeValueType<P> | U>;

// No need to be specific about Error types in these overrides, since there's no handler function
export function catchReturn<P extends PromiseLike<any>, U>(
  promise: P,
  filter1: CatchFilter<Error>,
  filter2: CatchFilter<Error>,
  filter3: CatchFilter<Error>,
  filter4: CatchFilter<Error>,
  filter5: CatchFilter<Error>,
  value: U
): GenericPromise<PromiseLikeValueType<P> | U>;
export function catchReturn<P extends PromiseLike<any>, U>(
  promise: P,
  filter1: CatchFilter<Error>,
  filter2: CatchFilter<Error>,
  filter3: CatchFilter<Error>,
  filter4: CatchFilter<Error>,
  value: U
): GenericPromise<PromiseLikeValueType<P> | U>;
export function catchReturn<P extends PromiseLike<any>, U>(
  promise: P,
  filter1: CatchFilter<Error>,
  filter2: CatchFilter<Error>,
  filter3: CatchFilter<Error>,
  value: U
): GenericPromise<PromiseLikeValueType<P> | U>;
export function catchReturn<P extends PromiseLike<any>, U>(
  promise: P,
  filter1: CatchFilter<Error>,
  filter2: CatchFilter<Error>,
  value: U
): GenericPromise<PromiseLikeValueType<P> | U>;
export function catchReturn<P extends PromiseLike<any>, U>(
  promise: P,
  filter1: CatchFilter<Error>,
  value: U
): GenericPromise<PromiseLikeValueType<P> | U>;

export function catchReturn(
  promise: Promise<any>,
  ...args: any[]
): Promise<any> {
  return promise.then(undefined, caughtHandlerFactory(args, catchReturnHandleFactory));
};

function catchReturnHandleFactory<T>(value: T) {
  return function catchReturnValue() {
    return value;
  };
};
