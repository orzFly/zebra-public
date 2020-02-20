function compareArray(a: readonly any[], b: readonly any[]) {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function createMemo<T, R extends readonly any[] = readonly any[]>(getter: (...args: R) => T, depGetter: () => R): () => T
export function createMemo<T>(getter: () => T, depGetter: () => readonly any[]): () => T

export function createMemo<T, R extends readonly any[] = readonly any[]>(getter: (...args: R) => T, depGetter: () => R): () => T {
  let storedValue: T
  let storedDep: R

  return () => {
    const dep = depGetter();
    if (compareArray(dep, storedDep)) return storedValue;
    const value = getter(...dep)
    storedValue = value;
    storedDep = dep;
    return value;
  }
}