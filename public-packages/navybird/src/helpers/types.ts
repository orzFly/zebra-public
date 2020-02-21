export type Resolvable<R> = R | PromiseLike<R>;

export type PromiseLikeValueType<T> = T extends PromiseLike<infer R> ? R : never
