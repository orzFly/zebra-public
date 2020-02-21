import { warning } from "../helpers/warning";
import { CatchFilter } from "./caught";

// https://github.com/sindresorhus/p-catch-if
// MIT © Sindre Sorhus

type ErrorConstructor = new(message?: string) => Error;

function isErrorConstructor(constructor: unknown): constructor is ErrorConstructor {
  return constructor === Error || (constructor && (<any>constructor).prototype instanceof Error);
}

export function catchIf<T>(predicates: ReadonlyArray<CatchFilter<any>>, catchHandler: (error: Error) => T | PromiseLike<T>): (
  error: Error
) => T | PromiseLike<T> {
  return async function catchIfHandler(this: any, error) {
    const THIS = this;
    if (typeof catchHandler !== 'function') {
      throw new TypeError('Expected a catch handler');
    }

    for (const predicate of predicates) {
      if (typeof predicate === 'boolean') {
        if (predicate === true) {
          return catchHandler.call(THIS, error);
        }
      } else if (isErrorConstructor(predicate)) {
        if (error instanceof predicate) {
          return catchHandler.call(THIS, error);
        }
      } else if (typeof predicate === 'function') {
        const value = await (predicate as any)(error);
        if (value === true) {
          return catchHandler.call(THIS, error);
        }
      } else if (predicate instanceof RegExp) {
        if (typeof error.message === 'string' && error.message.match(predicate)) {
          return catchHandler.call(THIS, error);
        }
      } else if (predicate && typeof predicate === "object") {
        const constructor = Object.getPrototypeOf(predicate)
        if (constructor !== Object.prototype && constructor !== null) {
          warning('A non-plain Object catch filter has been passed to Navybird.catch. Generally, this is wrong.')
        }

        let matched = true;
        for (const key of Object.keys(predicate)) {
          if (predicate[key] != (error as any)[key]) {
            matched = false;
            break;
          }
        }
        if (matched) {
          return catchHandler.call(THIS, error);
        }
      } else {
        warning('An invalid catch filter has been passed to Navybird.catch. This will be treated as catch-none.')
      }
    }

    throw error;
  }
}
