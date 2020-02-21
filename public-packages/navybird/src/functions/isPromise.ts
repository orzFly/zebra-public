export function isPromise<T>(obj: any): obj is Promise<T> {
  return (
    obj instanceof Promise ||
    (
      obj != null &&
      (typeof obj === 'object' || typeof obj === 'function') &&
      typeof obj.then === 'function' &&
      typeof obj.catch === 'function'
    )
  );
}
