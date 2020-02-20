import { mutable } from "./Mutable";

export class Defer<T = unknown> {
  public readonly promise = new Promise<T>((resolve, reject) => {
    const mutableThis = mutable(this)
    mutableThis.resolve = resolve;
    mutableThis.reject = reject;
  })
  public readonly resolve!: (value?: T | PromiseLike<T>) => void
  public readonly reject!: (reason?: any) => void
}
