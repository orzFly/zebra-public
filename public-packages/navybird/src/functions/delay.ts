import { GenericPromise, getPromiseConstructor } from '../helpers/getPromiseConstructor';
import { Resolvable } from '../helpers/types';

/**
 * Returns a promise that will be resolved with value (or undefined) after given ms milliseconds.
 * If value is a promise, the delay will start counting down when it is fulfilled and the returned promise will be fulfilled with the fulfillment value of the value promise.
 */

export function delay<R>(ms: number, value: Resolvable<R>): GenericPromise<R>;
export function delay(ms: number): GenericPromise<void>;

export function delay(
  ms: number,
  value?: any
): GenericPromise<any> {
  const Promise = getPromiseConstructor(this);

  return new Promise(function delayPromiseExecutor(resolve) {
    setTimeout(function delayTimeoutCallback() {
      resolve(value);
    }, ms);
  });
};
