import { GenericPromise, getPromiseConstructor } from '../helpers/getPromiseConstructor';
import { PromiseLikeValueType } from '../helpers/types';
import { CatchFilter } from './caught';
import { caughtHandlerFactory } from './caughtHandlerFactory';

/**
 * Like `.catch()` but rethrows the error
 */
export function tapCatch<P extends PromiseLike<any>, U>(
  promise: P,
  onReject: (error?: any) => U | PromiseLike<U>
): GenericPromise<PromiseLikeValueType<P>>;

export function tapCatch<P extends PromiseLike<any>, U, E1, E2, E3, E4, E5>(
  promise: P,
  filter1: CatchFilter<E1>,
  filter2: CatchFilter<E2>,
  filter3: CatchFilter<E3>,
  filter4: CatchFilter<E4>,
  filter5: CatchFilter<E5>,
  onReject: (error: E1 | E2 | E3 | E4 | E5) => U | PromiseLike<U>
): GenericPromise<PromiseLikeValueType<P>>;
export function tapCatch<P extends PromiseLike<any>, U, E1, E2, E3, E4>(
  promise: P,
  filter1: CatchFilter<E1>,
  filter2: CatchFilter<E2>,
  filter3: CatchFilter<E3>,
  filter4: CatchFilter<E4>,
  onReject: (error: E1 | E2 | E3 | E4) => U | PromiseLike<U>
): GenericPromise<PromiseLikeValueType<P>>;
export function tapCatch<P extends PromiseLike<any>, U, E1, E2, E3>(
  promise: P,
  filter1: CatchFilter<E1>,
  filter2: CatchFilter<E2>,
  filter3: CatchFilter<E3>,
  onReject: (error: E1 | E2 | E3) => U | PromiseLike<U>
): GenericPromise<PromiseLikeValueType<P>>;
export function tapCatch<P extends PromiseLike<any>, U, E1, E2>(
  promise: P,
  filter1: CatchFilter<E1>,
  filter2: CatchFilter<E2>,
  onReject: (error: E1 | E2) => U | PromiseLike<U>
): GenericPromise<PromiseLikeValueType<P>>;
export function tapCatch<P extends PromiseLike<any>, U, E1>(
  promise: P,
  filter1: CatchFilter<E1>,
  onReject: (error: E1) => U | PromiseLike<U>
): GenericPromise<PromiseLikeValueType<P>>;

export function tapCatch(
  this: any,
  promise: Promise<any>,
  ...args: any[]
): Promise<any> {
  const Promise = getPromiseConstructor(this);
  return promise.catch(function tapCatchHandle(err) {
    return Promise
      .resolve(err)
      .then(caughtHandlerFactory(args))
      .then(function tapCatchValue() {
        return Promise.reject(err);
      });
  });
};
