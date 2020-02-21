import { TypeError } from '../errors/TypeError';
import { GenericPromise } from '../helpers/getPromiseConstructor';
import { notEnumerableProp } from '../helpers/notEnumerableProp';
import { PromiseLikeValueType } from '../helpers/types';

export class Inspection<P extends PromiseLike<any>> {
  private _isPending: boolean
  private _isRejected: boolean
  private _isFulfilled: boolean
  private _value: PromiseLikeValueType<P> | undefined
  private _reason: any | undefined
  private _target: P

  constructor(target: P) {
    const self = this;

    this._isPending = true;
    this._isRejected = false;
    this._isFulfilled = false;
    this._value = undefined;
    this._reason = undefined;

    this._target = target.then(
      function inspectableResolvedHandle(v) {
        self._isFulfilled = true;
        self._isPending = false;
        self._value = v;
        return v;
      },
      function inspectableRejectedHandle(e) {
        self._isRejected = true;
        self._isPending = false;
        self._reason = e;
        throw e;
      }
    ) as any;
  }

  target() {
    return this._target;
  }

  isFulfilled() {
    return this._isFulfilled;
  }

  isRejected() {
    return this._isRejected;
  }

  isPending() {
    return this._isPending;
  }

  isResolved() {
    return this.isRejected || this._isFulfilled;
  }

  value() {
    if (this.isFulfilled()) return this._value;

    throw new TypeError("cannot get fulfillment value of a non-fulfilled promise\n\n    See http://goo.gl/MqrFmX\n");
  }

  reason() {
    if (this.isRejected()) return this._reason;

    throw new TypeError("cannot get rejection reason of a non-rejected promise\n\n    See http://goo.gl/MqrFmX\n");
  }

  error() {
    return this.reason()
  }
}

export function reflect<P extends PromiseLike<any>>(
  promise: P,
): GenericPromise<Inspection<P>> {
  const inspection = new Inspection(promise);
  const val = function reflectValue() {
    return inspection;
  };
  return inspection.target().then(val, val) as any;
};

export const NavybirdInspection = Symbol.for("NavybirdInspection");

export interface Inspectable<P extends PromiseLike<any>>
  extends Pick<Inspection<PromiseLikeValueType<P>>,
    'isFulfilled' | 'isPending' | 'isRejected' | 'isResolved' | 'value' | 'reason'
  > {
}

export function inspectable<P extends PromiseLike<any>>(
  promise: P,
): P & Inspectable<P> {
  if ((promise as any)[NavybirdInspection]) return (promise as any)[NavybirdInspection]!;

  const inspection = new Inspection(promise);
  const result = inspection.target();
  Object.assign(result, {
    [NavybirdInspection]: inspection,
  })

  for (const key of ["isFulfilled", "isPending", "isRejected", "isResolved", "value", "reason"] as const) {
    notEnumerableProp(result, key, Inspection.prototype[key].bind(inspection));
  }

  return result as any;
};
