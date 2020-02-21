import { wrapAsOperationalError } from '../errors/OperationalError';
import { GenericPromise, getPromiseConstructor } from '../helpers/getPromiseConstructor';

export interface FromCallbackOptions {
  multiArgs?: boolean;
}

export function fromCallback(
  resolver: (callback: (err: any, result?: any) => void) => void,
  options?: FromCallbackOptions
): GenericPromise<any>;

export function fromCallback<T>(
  resolver: (callback: (err: any, result?: T) => void) => void,
  options?: FromCallbackOptions
): GenericPromise<T>;

export function fromCallback(
  fn: (callback: (err: any, result?: any) => void) => void,
  options?: FromCallbackOptions
) {
  const Promise = getPromiseConstructor(this);

  return new Promise(function fromCallbackExecutor(resolve, reject) {
    const nodeback =
      options != null && Object(options).multiArgs
        ? function fromCallbackPromiseMultipleArgsNodeback(err: any, ...args: any[]) {
          if (err) schedule(() => reject(wrapAsOperationalError(err)));
          else schedule(() => resolve(args));
        }
        : function fromCallbackPromiseSingleArgNodeback(err: any, arg: any[]) {
          if (err) schedule(() => reject(wrapAsOperationalError(err)));
          else schedule(() => resolve(arg));
        };

    try {
      fn(nodeback);
    } catch (e) {
      reject(e);
    }
  });
};

export type FromNodeOptions = FromCallbackOptions
export const fromNode = fromCallback

const schedule = setImmediate;