import { TypeError } from '../errors';
import { GenericPromise, getPromiseConstructor } from '../helpers/getPromiseConstructor';
import { Resolvable } from '../helpers/types';
import { isPromiseLike } from './isPromiseLike';
import { schedule, tapSchedule } from './schedule';

export interface ConcurrencyOption {
  concurrency: number;
}

/**
 * Map an array, or a promise of an array, which contains a promises (or a mix of promises and values) with the given `mapper` function with the signature `(item, index, arrayLength)` where `item` is the resolved value of a respective promise in the input array.
 * If any promise in the input array is rejected the returned promise is rejected as well.
 *
 * If the `mapper` function returns promises or thenables, the returned promise will wait for all the mapped results to be resolved as well.
 *
 * *The original array is not modified.*
 */
export function map<R, U>(
  this: any,
  iterable: Resolvable<Iterable<Resolvable<R>>>,
  mapper: (item: R, index: number, arrayLength: number) => Resolvable<U>,
  opts?: ConcurrencyOption
): GenericPromise<U[]> {
  const Promise = getPromiseConstructor(this);

  return new Promise(function mapPromiseExecutor(resolve, reject) {
    if (isPromiseLike(iterable)) {
      return resolve(
        iterable.then(function mapIterableFulfilled(val) {
          return map(val, mapper, opts) as PromiseLike<U[]>;
        })
      );
    }

    opts = Object.assign({
      concurrency: Infinity,
    }, opts);

    if (typeof mapper !== "function") {
      throw new TypeError(`Mapper is not function`);
      // TODO: return resolve(utils.apiRejection(constants.FUNCTION_ERROR + utils.classString(fn)));
    }

    const concurrency = opts.concurrency;

    if (!(typeof concurrency === "number" && concurrency >= 1)) {
      throw new TypeError(
        `Expected \`concurrency\` to be a number from 1 and up, got \`${concurrency}\` (${typeof concurrency})`
      );
    }

    const ret: U[] = [];
    const length = (iterable as any).length;
    const iterator = iterable[Symbol.iterator]();
    let isRejected = false;
    let iterableDone = false;
    let resolvingCount = 0;
    let currentIdx = 0;

    const next = function mapNext() {
      if (isRejected) return;

      const nextItem = iterator.next();
      const i = currentIdx;
      currentIdx++;

      if (nextItem.done) {
        iterableDone = true;
        if (resolvingCount === 0) schedule(() => resolve(ret));
        return;
      }

      resolvingCount++;

      Promise.resolve(nextItem.value)
        .then(function mapMapperWrapper(el) {
          return mapper(el, i, length);
        })
        .then(tapSchedule)
        .then(
          function mapResolvedCallback(val) {
            ret[i] = val;
            resolvingCount--;
            next();
          },
          function mapRejectedCallback(err) {
            isRejected = true;
            reject(err);
          }
        );
    };

    for (let i = 0; i < concurrency; i++) {
      next();
      if (iterableDone) break;
    }
  });
};
