import { notEnumerableProp } from '../helpers/notEnumerableProp';

export namespace Capsule {
  export class TimeoutError extends Error {
    constructor(message: string) {
      super(message);

      notEnumerableProp(this, "name", "TimeoutError");
      notEnumerableProp(this, "message", message);

      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
      }
    }
  }
}

export const TimeoutError = (<T>(constructor: T): T & (T extends (new (...args: infer A) => infer R) ? (...args: A) => R : never) => {
  const newTarget = function TimeoutError(...args: any[]) {
    return new (constructor as any)(...args)
  }
  newTarget.prototype = (constructor as any).prototype
  newTarget.prototype.constructor = newTarget
  return newTarget as any
})(Capsule.TimeoutError);
export type TimeoutError = Capsule.TimeoutError
