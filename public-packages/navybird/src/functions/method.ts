import { TypeError } from '../errors/TypeError';
import { GenericPromise, getPromiseConstructor } from '../helpers/getPromiseConstructor';
import { isPromise } from './isPromise';

export function method<T, Args extends any[]>(
  this: any,
  fn: (...args: Args) => T | PromiseLike<T>
): (...args: Args) => GenericPromise<T> {
  const Promise = getPromiseConstructor(this);
  if (typeof fn !== "function") {
    throw new TypeError(`fn is not function`);
    // TODO: return errors.TypeError(constants.FUNCTION_ERROR + utils.classString(fn));
  }

  return function (this: any) {
    try {
      const result = (fn as Function).apply(this, arguments)
      if (isPromise(result)) {
        return result;
      } else {
        return Promise.resolve(result) as any;
      }
    } catch (e) {
      return Promise.reject(e);
    }
  }
}
