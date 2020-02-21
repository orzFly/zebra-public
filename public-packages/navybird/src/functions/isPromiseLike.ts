export function isPromiseLike<T>(obj: any): obj is PromiseLike<T> {
  return (
    obj instanceof Promise ||
    (
      obj != null &&
      (typeof obj === 'object' || typeof obj === 'function') &&
      typeof obj.then === 'function'
    )
  );
}
