import { notEnumerableProp } from '../helpers/notEnumerableProp';
import { BLUEBIRD_ERRORS, OPERATIONAL_ERROR_KEY } from './bluebird';

export namespace Capsule {
  export class OperationalError extends Error {
    readonly cause: any
    readonly [OPERATIONAL_ERROR_KEY] = true

    constructor(message: any) {
      super(message);

      notEnumerableProp(this, "name", "OperationalError");
      notEnumerableProp(this, "message", message);
      this.cause = message;

      if (message instanceof Error) {
        notEnumerableProp(this, "message", message.message);
        notEnumerableProp(this, "stack", message.stack);
      } else if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
      }
    }
  }
}

export const OperationalError = (<T>(constructor: T): T & (T extends (new (...args: infer A) => infer R) ? (...args: A) => R : never) => {
  const newTarget = function OperationalError(...args: any[]) {
    return new (constructor as any)(...args)
  }
  newTarget.prototype = (constructor as any).prototype
  newTarget.prototype.constructor = newTarget
  return newTarget as any
})(Capsule.OperationalError)
export type OperationalError = Capsule.OperationalError

const regexErrorKey = /^(?:name|message|stack|cause)$/;

function isUntypedError(obj: unknown): obj is Error {
  return obj instanceof Error && Object.getPrototypeOf(obj) === Error.prototype;
};

export function wrapAsOperationalError<T extends Error>(obj: T): OperationalError | T {
  var ret;
  if (isUntypedError(obj)) {
    ret = new OperationalError(obj);
    ret.name = obj.name;
    ret.message = obj.message;
    ret.stack = obj.stack;
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; ++i) {
      var key = keys[i];
      if (!regexErrorKey.test(key)) {
        (ret as any)[key] = (obj as any)[key];
      }
    }
    return ret;
  }
  markAsOriginatingFromRejection(obj);
  return obj;
};

export function markAsOriginatingFromRejection(e: Error) {
  try {
    notEnumerableProp(e, OPERATIONAL_ERROR_KEY, true);
  } catch (ignore) { }
}

export function originatesFromRejection(e?: any) {
  if (e == null) return false;
  if (e instanceof OperationalError) return true;
  if (e[OPERATIONAL_ERROR_KEY] === true) return true;

  const konstructor = (<any>Error)[BLUEBIRD_ERRORS] && (<any>Error)[BLUEBIRD_ERRORS].OperationalError
  if (konstructor && e instanceof konstructor) return true;

  return false;
};

function isPrimitive(val: any) {
  return val == null || val === true || val === false ||
    typeof val === "string" || typeof val === "number";

}

function safeToString(obj: any) {
  try {
    return obj + "";
  } catch (e) {
    return "[no string representation]";
  }
}

export function maybeWrapAsError(maybeError: any): Error {
  if (!isPrimitive(maybeError)) return maybeError;

  return new Error(safeToString(maybeError));
}
