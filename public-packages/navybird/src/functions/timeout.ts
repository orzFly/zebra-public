import { TimeoutError, TypeError } from '../errors';
import { GenericPromise } from '../helpers/getPromiseConstructor';
import { Resolvable } from '../helpers/types';
import { lastly } from './lastly';

export function timeout<T>(
  promise: PromiseLike<T> | (PromiseLike<T> & { cancel(): any }),
  ms: number,
  fallback?: string | Error
): GenericPromise<T>

export function timeout<T, R>(
  promise: PromiseLike<T> | (PromiseLike<T> & { cancel(): any }),
  ms: number,
  fallback: () => Resolvable<R>
): GenericPromise<R>

export function timeout<T>(
  promise: PromiseLike<T> | (PromiseLike<T> & { cancel(): any  }),
  ms: number,
  fallback?: string | Error | Function
): GenericPromise<T> {
  const promiseConstructor = promise.constructor as PromiseConstructor

  return new promiseConstructor(function timeoutPromiseExecutor(resolve, reject) {
    if (typeof ms !== "number" || ms < 0) {
      throw new TypeError("Expected `ms` to be a positive number");
    }

    const timer = setTimeout(function timeoutPromiseTimeout() {
      if (typeof fallback === "function") {
        try {
          resolve(fallback());
        } catch (err) {
          reject(err);
        }
        return;
      }

      const message =
        typeof fallback === "string"
          ? fallback
          : `Promise timed out after ${ms} milliseconds`;
      const err =
        fallback instanceof Error ? fallback : new TimeoutError(message);

      if ('cancel' in promise && typeof promise.cancel === "function") {
        promise.cancel();
      }

      reject(err);
    }, ms);

    const p = promise.then(resolve, reject)
    lastly(p, function timeoutFinally() {
      clearTimeout(timer);
    });
  });
};
