import { Resolvable, PromiseLikeValueType } from '../helpers/types';

export function lastly<P extends PromiseLike<any>>(promise: P, handler: () => Resolvable<void | undefined | null | any>): P {
  handler = handler || function () { };

  return promise.then<PromiseLikeValueType<P>, never>(
    function finallyResolvedHandle(val) {
      return Promise
        .resolve(handler.call(this))
        .then(function finallyResolvedValue() {
          return val;
        });
    },
    function finallyRejectedHandle(err) {
      return Promise
        .resolve(handler.call(this))
        .then(function finallyRejectedValue() {
          throw err;
        });
    }
  ) as P;
}

export { lastly as finally };
