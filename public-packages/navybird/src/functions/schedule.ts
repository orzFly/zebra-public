import { GenericPromise, getPromiseConstructor } from '../helpers/getPromiseConstructor';
import { Resolvable } from '../helpers/types';

export function schedule(fn: () => any) {
  globalSetImmediate(fn);
}

const globalSetImmediate = setImmediate;

export function schedulePromise<R>(value: Resolvable<R>): GenericPromise<R>;
export function schedulePromise(): GenericPromise<void>;

export function schedulePromise(
  this: any,
  value?: any
): GenericPromise<any> {
  const Promise = getPromiseConstructor(this);

  return new Promise(function schedulePromiseExecutor(resolve) {
    schedule(function scheduleTimeoutCallback() {
      resolve(value);
    });
  });
};


export function tapSchedule<T>(r: T) { return schedulePromise(r) }
