import { GenericPromise, getPromiseConstructor } from '../helpers/getPromiseConstructor';

export function attempt<T>(fn: () => T | PromiseLike<T>): GenericPromise<T> {
  const Promise = getPromiseConstructor(this);
  try {
    return Promise.resolve(fn());
  } catch (e) {
    return Promise.reject(e);
  }
}