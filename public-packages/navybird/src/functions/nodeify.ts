import { PromiseLikeValueType } from '../helpers/types';

export interface SpreadOption {
  spread: boolean;
}

export function nodeify<P extends PromiseLike<any>>(
  promise: P,
  callback: (err: any, value?: PromiseLikeValueType<P>) => void,
  options?: SpreadOption
): P

export function nodeify<P extends PromiseLike<any>>(
  promise: P,
  ...sink: any[]
): P

export function nodeify<P extends PromiseLike<any>>(
  promise: P,
  callback: (err: any, value?: PromiseLikeValueType<P>) => void,
  options?: SpreadOption
): P {
  if (typeof callback !== "function") {
    return promise;
  }

  const spread = options !== undefined && Object(options).spread;
  const successAdapter = spread
    ? function nodeifySpreadAdapter(res: PromiseLikeValueType<P>) {
      const THIS = this;
      nextTick(function nodeifySpreadAdapterNextTick() {
        if (Array.isArray(res)) {
          callback.apply(THIS, [null].concat(res));
        }
        return callback.call(THIS, null, res);
      });
    }
    : function nodeifyNormalAdapter(res: PromiseLikeValueType<P>) {
      const THIS = this;
      nextTick(function nodeifyNormalAdapterNextTick() {
        if (res === undefined)
          return callback.call(THIS, null);
        return callback.call(THIS, null, res);
      });
    };

  const errorAdapter = function nodeifyErrorAdapter(err: any) {
    const THIS = this;
    if (!err) {
      var newReason = new Error(err + "");
      (newReason as any).cause = err;
      err = newReason;
    }

    nextTick(function nodeifyErrorAdapterNextTick() {
      callback.call(THIS, err);
    });
  };

  return promise.then(successAdapter, errorAdapter) as any;
}

const nextTick = process.nextTick;