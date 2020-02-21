import { GenericPromise, getPromiseConstructor } from '../helpers/getPromiseConstructor';
import { Resolvable } from '../helpers/types';
import { reduce } from './reduce';
import { tapSchedule } from './schedule';

/**
 * Given an Iterable(arrays are Iterable), or a promise of an Iterable, which produces promises (or a mix of promises and values), iterate over all the values in the Iterable into an array and iterate over the array serially, in-order.
 *
 * Returns a promise for an array that contains the values returned by the iterator function in their respective positions.
 * The iterator won't be called for an item until its previous item, and the promise returned by the iterator for that item are fulfilled.
 * This results in a mapSeries kind of utility but it can also be used simply as a side effect iterator similar to Array#forEach.
 *
 * If any promise in the input array is rejected or any promise returned by the iterator function is rejected, the result will be rejected as well.
 */
export function mapSeries<R, U>(
  this: any,
  iterable: Resolvable<Iterable<Resolvable<R>>>,
  iterator: (item: R, index: number, arrayLength: number) => Resolvable<U>
): GenericPromise<U[]> {
  const Promise = getPromiseConstructor(this);
  const ret: U[] = [];

  return Promise.resolve(
    reduce(
      iterable,
      function mapSeriesReducer(a, b, i, length) {
        return Promise.resolve(iterator(b, i, length)).then(tapSchedule).then(
          function mapSeriesMapperCallback(val) {
            ret.push(val);
          }
        );
      },
      {}
    ).then(tapSchedule).then(function mapSeriesResult() {
      return ret
    })
  );
};
