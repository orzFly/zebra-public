export type Mutable<T> = { -readonly [KeyType in keyof T]: T[KeyType]; }
export function mutable<T>(obj: T): Mutable<T> { return obj as any }

export type MutableMap<T> = T extends ReadonlyMap<infer K, infer V> ? Map<K, V> : never
export function mutableMap<T>(obj: T): MutableMap<T> { return obj as any }
