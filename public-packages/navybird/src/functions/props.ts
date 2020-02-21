import { GenericPromise, getPromiseConstructor } from "../helpers/getPromiseConstructor";
import { Resolvable } from "../helpers/types";

export type ResolvableProps<T> = object & { [K in keyof T]: Resolvable<T[K]> };

/**
 * Like ``Promise.all`` but for object properties instead of array items. Returns a promise that is fulfilled when all the properties of the object are fulfilled.
 *
 * The promise's fulfillment value is an object with fulfillment values at respective keys to the original object.
 * If any promise in the object rejects, the returned promise is rejected with the rejection reason.
 *
 * If `object` is a trusted `Promise`, then it will be treated as a promise for object rather than for its properties.
 * All other objects are treated for their properties as is returned by `Object.keys` - the object's own enumerable properties.
 *
 * *The original object is not modified.*
 */
export function props<K, V>(promise: Resolvable<Map<K, Resolvable<V>>>): GenericPromise<Map<K, V>>;
export function props<T>(promise: Resolvable<ResolvableProps<T>>): GenericPromise<T>;

export function props(this: any, p: any) {
  const Promise = getPromiseConstructor(this);
  return Promise.resolve((async () => {
    const input = await p;
    return input instanceof Map ? propsMap(input) : propsObject(input);
  })())
}

async function propsMap<K, V>(map: Map<K, Resolvable<V>>): Promise<Map<K, V>> {
  const awaitedEntries = [...map.entries()].map(async ([key, value]) => [key, await value]);
  const values = await Promise.all(awaitedEntries);
  const result = new Map();

  for (const [index, key] of [...map.keys()].entries()) {
    result.set(key, values[index][1]);
  }

  return result;
}

async function propsObject<T>(map: ResolvableProps<T>): Promise<T> {
  const awaitedEntries = Object.entries(map).map(async ([key, value]) => [key, await value]);
  const values = await Promise.all(awaitedEntries);
  const result: any = {};

  for (const [index, key] of Object.keys(map).entries()) {
    result[key] = values[index][1];
  }

  return result;
}
