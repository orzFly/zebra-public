import { GenericPromise, getPromiseConstructor } from '../helpers/getPromiseConstructor';
import { Resolvable } from '../helpers/types';
import { isPromiseLike } from './isPromiseLike';

/**
 * Reduce an array, or a promise of an array, which contains a promises (or a mix of promises and values) with the given `reducer` function with the signature `(total, current, index, arrayLength)` where `item` is the resolved value of a respective promise in the input array.
 * If any promise in the input array is rejected the returned promise is rejected as well.
 *
 * If the reducer function returns a promise or a thenable, the result for the promise is awaited for before continuing with next iteration.
 *
 * *The original array is not modified. If no `initialValue` is given and the array doesn't contain at least 2 items, the callback will not be called and `undefined` is returned.
 * If `initialValue` is given and the array doesn't have at least 1 item, `initialValue` is returned.*
 */

export function reduce<R, U>(
  iterable: Resolvable<Iterable<Resolvable<R>>>,
  reducer: (memo: U, current: R, index: number, arrayLength: number) => Resolvable<U>,
  initialValue?: U
): GenericPromise<U>

export function reduce<R>(
  iterable: Resolvable<Iterable<Resolvable<R>>>,
  reducer: (memo: R, current: R, index: number, arrayLength: number) => Resolvable<R>,
): GenericPromise<R>

export function reduce<R, U>(
  this: any,
  iterable: Resolvable<Iterable<Resolvable<R>>>,
  reducer: (memo: U, current: R, index: number, arrayLength: number) => Resolvable<U>,
  initialValue?: U
): GenericPromise<U> {
  const Promise = getPromiseConstructor(this);

  return new Promise(function reducePromiseExecutor(resolve, reject) {
    if (isPromiseLike(iterable)) {
      return resolve(
        iterable.then(function reduceIterableFulfilled(val) {
          return reduce(val, reducer, initialValue) as PromiseLike<U>;
        })
      );
    }

    const length = (iterable as any).length;
    const iterator = iterable[Symbol.iterator]();
    let i = 0;

    const next = function reduceNext(memo: Resolvable<U>) {
      const el = iterator.next();

      if (el.done) {
        resolve(memo);
        return;
      }

      Promise.all([memo, el.value])
        .then(function reduceWrapper(value) {
          next(reducer(value[0], value[1], i++, length));
        })
        .catch(reject);
    };

    if (initialValue === undefined) {
      const el = iterator.next();
      if (el.done) {
        resolve(undefined);
        return;
      }
      next(el.value as any as U);
    } else {
      next(initialValue);
    }
  });
};
