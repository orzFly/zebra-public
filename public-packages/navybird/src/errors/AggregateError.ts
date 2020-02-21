import { notEnumerableProp } from '../helpers/notEnumerableProp';
import { OPERATIONAL_ERROR_KEY } from './bluebird';

export namespace Capsule {
  let level = 0;

  export class AggregateError<T = any> extends Error {
    constructor(message: string) {
      super(message);

      notEnumerableProp(this, "name", "AggregateError");
      notEnumerableProp(this, "message", message);

      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
      }
    }

    [i: number]: T

    join!: Array<T>['join']
    pop!: Array<T>['pop']
    push!: Array<T>['push']
    shift!: Array<T>['shift']
    unshift!: Array<T>['unshift']
    slice!: Array<T>['slice']
    filter!: Array<T>['filter']
    forEach!: Array<T>['forEach']
    some!: Array<T>['some']
    every!: Array<T>['every']
    map!: Array<T>['map']
    indexOf!: Array<T>['indexOf']
    lastIndexOf!: Array<T>['lastIndexOf']
    reduce!: Array<T>['reduce']
    reduceRight!: Array<T>['reduceRight']
    sort!: Array<T>['sort']
    reverse!: Array<T>['reverse']

    length!: Array<T>['length']

    toString() {
      var indent = Array(level * 4 + 1).join(" ");
      var ret = "\n" + indent + "AggregateError of:" + "\n";
      level++;
      indent = Array(level * 4 + 1).join(" ");
      for (var i = 0; i < this.length; ++i) {
        var str = (this[i] === this as any) ? "[Circular AggregateError]" : this[i] + "";
        var lines = str.split("\n");
        for (var j = 0; j < lines.length; ++j) {
          lines[j] = indent + lines[j];
        }
        str = lines.join("\n");
        ret += str + "\n";
      }
      level--;
      return ret;
    }
  }

  for (const key of ["join", "pop", "push", "shift", "unshift", "slice", "filter", "forEach", "some", "every", "map", "indexOf", "lastIndexOf", "reduce", "reduceRight", "sort", "reverse"] as const) {
    if (typeof Array.prototype[key] === "function") {
      (AggregateError.prototype as any)[key] = Array.prototype[key];
    }
  }

  Object.defineProperty(AggregateError.prototype, 'length', {
    value: 0,
    configurable: false,
    writable: true,
    enumerable: true
  });

  (<any>AggregateError.prototype)[OPERATIONAL_ERROR_KEY] = true;
}

export const AggregateError = (<T>(constructor: T): T & (T extends (new (...args: infer A) => infer R) ? (...args: A) => R : never) => {
  const newTarget = function AggregateError(...args: any[]) {
    return new (constructor as any)(...args)
  }
  newTarget.prototype = (constructor as any).prototype
  newTarget.prototype.constructor = newTarget
  return newTarget as any
})(Capsule.AggregateError);
export type AggregateError<T = any> = Capsule.AggregateError<T>
