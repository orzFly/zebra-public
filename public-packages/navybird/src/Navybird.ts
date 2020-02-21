import * as errors from './errors';
import { originatesFromRejection } from './errors/OperationalError';
import { attempt } from './functions/attempt';
import { catchIf } from './functions/catchIf';
import { catchReturn } from './functions/catchReturn';
import { catchThrow } from './functions/catchThrow';
import { CatchFilter, caught } from './functions/caught';
import { Defer, defer } from './functions/defer';
import { delay } from './functions/delay';
import { eachSeries } from './functions/eachSeries';
import { fromCallback, FromCallbackOptions } from './functions/fromCallback';
import { immediate } from './functions/immediate';
import { inspectable, Inspectable, Inspection, reflect } from './functions/inspectable';
import { isPromise } from './functions/isPromise';
import { isPromiseLike } from './functions/isPromiseLike';
import { join } from './functions/join';
import { lastly } from './functions/lastly';
import { ConcurrencyOption, map } from './functions/map';
import { mapSeries } from './functions/mapSeries';
import { method } from './functions/method';
import { nodeify, SpreadOption } from './functions/nodeify';
import { MultiArgsNoErrorPromisifyOptions, MultiArgsPromisifyOptions, NoErrorPromisifyOptions, promisify, PromisifyOptions } from './functions/promisify';
import { props, ResolvableProps } from './functions/props';
import { reduce } from './functions/reduce';
import { tapCatch } from './functions/tapCatch';
import { timeout } from './functions/timeout';
import { notEnumerableProp } from './helpers/notEnumerableProp';
import { PromiseLikeValueType, Resolvable } from './helpers/types';
import { warning } from './helpers/warning';

const nativePromiseMethods = (
  <K extends Array<keyof PromiseConstructor>>(...keys: K):
    Pick<PromiseConstructor, Extract<K[keyof K], keyof PromiseConstructor>> => {
    const result = Object.create(null)
    for (const key of keys) {
      result[key] = Promise[key]
    }
    return result;
  })(
    "resolve", "reject",
    "all", "race",
  );

const ThisBoundedSymbol = Symbol.for('Navybird.ThisBounded')

function createBoundInstance(thisArg?: any) {
  warning('A Navybird bound instance was created. Navybird.bind is provided for compatibility only thus the implemation has very bad performance. Do not use this in production!')
  const Boundbird = getNewLibraryCopy()
  const then = Boundbird.prototype.then
  const ref = { thisArg };
  (Boundbird.prototype as any)[ThisBoundedSymbol] = ref;
  Boundbird.prototype.then = function boundThen(onfulfilled?, onrejected?) {
    return then.call(this,
      onfulfilled && function boundOnFulfilled() {
        return onfulfilled.apply(ref.thisArg, arguments)
      },
      onrejected && function boundOnRejected() {
        return onrejected.apply(ref.thisArg, arguments)
      }
    )
  }
  return { Boundbird, ref };
}

export class Navybird<T> extends Promise<T> {
  static isPromise: typeof isPromise = isPromise
  static isPromiseLike: typeof isPromiseLike = isPromiseLike

  /** @deprecated */
  static bind(thisArg: any, resolvedValue?: any) {
    const { Boundbird, ref } = createBoundInstance()
    return Boundbird.resolve(thisArg).tap((r) => ref.thisArg = r).return(resolvedValue)
  }

  /** @deprecated */
  bind(thisArg: any): Navybird<T> {
    const { Boundbird, ref } = createBoundInstance()
    let throwed = false, error: any = undefined;
    const valuePromise = Boundbird.resolve(thisArg)
      .tap((r) => ref.thisArg = r)
      .tapCatch((err) => { throwed = true; error = err; })

    return Boundbird.resolve(this.then((v) => {
      return valuePromise.return(v)
    }, (e) => {
      return valuePromise.then(
        () => { throw e; },
        throwed ? () => { throw error; } : () => { throw e; }
      )
    }));
  }

  /**
   * @$TypeExpand typeof defer
   * @$$Eval (str) => str.replace(/Defer</g, "NavybirdDefer<")
   */
  static defer: <T = any>() => NavybirdDefer<T> = null as any

  /**
   * @$TypeExpand typeof delay
   * @$$Eval (str) => str.replace(/GenericPromise/g, "Navybird")
   */
  static delay: { <R>(ms: number, value: Resolvable<R>): Navybird<R>; (ms: number): Navybird<void>; } = null as any

  /**
   * @$TypeExpand typeof eachSeries
   * @$$Eval (str) => str.replace(/GenericPromise/g, "Navybird")
   */
  static each: <R, U>(iterable: Resolvable<Iterable<Resolvable<R>>>, iterator: (item: R, index: number, arrayLength: number) => Resolvable<U>) => Navybird<R[]> = null as any

  /**
   * @$TypeExpand typeof eachSeries
   * @$$Eval (str) => str.replace(/GenericPromise/g, "Navybird")
   */
  static eachSeries: <R, U>(iterable: Resolvable<Iterable<Resolvable<R>>>, iterator: (item: R, index: number, arrayLength: number) => Resolvable<U>) => Navybird<R[]> = null as any

  /**
   * @$TypeExpand typeof immediate
   * @$$Eval (str) => str.replace(/GenericPromise/g, "Navybird")
   */
  static immediate: { <R>(value: Resolvable<R>): Navybird<R>; (): Navybird<void>; } = null as any

  /**
   * @$TypeExpand typeof fromCallback
   * @$$Eval (str) => str.replace(/GenericPromise/g, "Navybird")
   */
  static fromCallback: { (resolver: (callback: (err: any, result?: any) => void) => void, options?: FromCallbackOptions): Navybird<any>; <T>(resolver: (callback: (err: any, result?: T) => void) => void, options?: FromCallbackOptions): Navybird<T>; } = null as any

  /**
   * @$TypeExpand typeof fromCallback
   * @$$Eval (str) => str.replace(/GenericPromise/g, "Navybird")
   */
  static fromNode: { (resolver: (callback: (err: any, result?: any) => void) => void, options?: FromCallbackOptions): Navybird<any>; <T>(resolver: (callback: (err: any, result?: T) => void) => void, options?: FromCallbackOptions): Navybird<T>; } = null as any

  /**
   * @$TypeExpand typeof join
   * @$$Eval (str) => str.replace(/GenericPromise/g, "Navybird")
   */
  static join: { <R, A1>(arg1: Resolvable<A1>, handler: (arg1: A1) => Resolvable<R>): Navybird<R>; <R, A1, A2>(arg1: Resolvable<A1>, arg2: Resolvable<A2>, handler: (arg1: A1, arg2: A2) => Resolvable<R>): Navybird<R>; <R, A1, A2, A3>(arg1: Resolvable<A1>, arg2: Resolvable<A2>, arg3: Resolvable<A3>, handler: (arg1: A1, arg2: A2, arg3: A3) => Resolvable<R>): Navybird<R>; <R, A1, A2, A3, A4>(arg1: Resolvable<A1>, arg2: Resolvable<A2>, arg3: Resolvable<A3>, arg4: Resolvable<A4>, handler: (arg1: A1, arg2: A2, arg3: A3, arg4: A4) => Resolvable<R>): Navybird<R>; <R, A1, A2, A3, A4, A5>(arg1: Resolvable<A1>, arg2: Resolvable<A2>, arg3: Resolvable<A3>, arg4: Resolvable<A4>, arg5: Resolvable<A5>, handler: (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5) => Resolvable<R>): Navybird<R>; <R>(...values: Resolvable<R>[]): Navybird<R[]>; } = null as any

  /**
   * @$TypeExpand typeof map
   * @$$Eval (str) => str.replace(/GenericPromise/g, "Navybird")
   */
  static map: <R, U>(iterable: Resolvable<Iterable<Resolvable<R>>>, mapper: (item: R, index: number, arrayLength: number) => Resolvable<U>, opts?: ConcurrencyOption) => Navybird<U[]> = null as any

  /**
   * @$TypeExpand typeof mapSeries
   * @$$Eval (str) => str.replace(/GenericPromise/g, "Navybird")
   */
  static mapSeries: <R, U>(iterable: Resolvable<Iterable<Resolvable<R>>>, iterator: (item: R, index: number, arrayLength: number) => Resolvable<U>) => Navybird<U[]> = null as any

  /**
   * @$TypeExpand typeof reduce
   * @$$Eval (str) => str.replace(/GenericPromise/g, "Navybird")
   */
  static reduce: { <R, U>(iterable: Resolvable<Iterable<Resolvable<R>>>, reducer: (memo: U, current: R, index: number, arrayLength: number) => Resolvable<U>, initialValue?: U): Navybird<U>; <R>(iterable: Resolvable<Iterable<Resolvable<R>>>, reducer: (memo: R, current: R, index: number, arrayLength: number) => Resolvable<R>): Navybird<R>; } = null as any

  /**
   * @$TypeExpand typeof promisify
   * @$$Eval (str) => str.replace(/GenericPromise/g, "Navybird").replace(/this: PromiseConstructorLikeThis, /g, "")
   */
  static promisify: { <T extends any[]>(func: (callback: (...result: T) => void) => void, options: MultiArgsNoErrorPromisifyOptions): () => Navybird<T>; <T extends any[], A1>(func: (arg1: A1, callback: (...result: T) => void) => void, options: MultiArgsNoErrorPromisifyOptions): (arg1: A1) => Navybird<T>; <T extends any[], A1, A2>(func: (arg1: A1, arg2: A2, callback: (...result: T) => void) => void, options: MultiArgsNoErrorPromisifyOptions): (arg1: A1, arg2: A2) => Navybird<T>; <T extends any[], A1, A2, A3>(func: (arg1: A1, arg2: A2, arg3: A3, callback: (...result: T) => void) => void, options: MultiArgsNoErrorPromisifyOptions): (arg1: A1, arg2: A2, arg3: A3) => Navybird<T>; <T extends any[], A1, A2, A3, A4>(func: (arg1: A1, arg2: A2, arg3: A3, arg4: A4, callback: (...result: T) => void) => void, options: MultiArgsNoErrorPromisifyOptions): (arg1: A1, arg2: A2, arg3: A3, arg4: A4) => Navybird<T>; <T extends any[], A1, A2, A3, A4, A5>(func: (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5, callback: (...result: T) => void) => void, options: MultiArgsNoErrorPromisifyOptions): (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5) => Navybird<T>; <T>(func: (callback: (result?: T) => void) => void, options: NoErrorPromisifyOptions): () => Navybird<T>; <T, A1>(func: (arg1: A1, callback: (result?: T) => void) => void, options: NoErrorPromisifyOptions): (arg1: A1) => Navybird<T>; <T, A1, A2>(func: (arg1: A1, arg2: A2, callback: (result?: T) => void) => void, options: NoErrorPromisifyOptions): (arg1: A1, arg2: A2) => Navybird<T>; <T, A1, A2, A3>(func: (arg1: A1, arg2: A2, arg3: A3, callback: (result?: T) => void) => void, options: NoErrorPromisifyOptions): (arg1: A1, arg2: A2, arg3: A3) => Navybird<T>; <T, A1, A2, A3, A4>(func: (arg1: A1, arg2: A2, arg3: A3, arg4: A4, callback: (result?: T) => void) => void, options: NoErrorPromisifyOptions): (arg1: A1, arg2: A2, arg3: A3, arg4: A4) => Navybird<T>; <T, A1, A2, A3, A4, A5>(func: (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5, callback: (result?: T) => void) => void, options: NoErrorPromisifyOptions): (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5) => Navybird<T>; <T extends any[]>(func: (callback: (err: any, ...result: T) => void) => void, options: MultiArgsPromisifyOptions): () => Navybird<T>; <T extends any[], A1>(func: (arg1: A1, callback: (err: any, ...result: T) => void) => void, options: MultiArgsPromisifyOptions): (arg1: A1) => Navybird<T>; <T extends any[], A1, A2>(func: (arg1: A1, arg2: A2, callback: (err: any, ...result: T) => void) => void, options: MultiArgsPromisifyOptions): (arg1: A1, arg2: A2) => Navybird<T>; <T extends any[], A1, A2, A3>(func: (arg1: A1, arg2: A2, arg3: A3, callback: (err: any, ...result: T) => void) => void, options: MultiArgsPromisifyOptions): (arg1: A1, arg2: A2, arg3: A3) => Navybird<T>; <T extends any[], A1, A2, A3, A4>(func: (arg1: A1, arg2: A2, arg3: A3, arg4: A4, callback: (err: any, ...result: T) => void) => void, options: MultiArgsPromisifyOptions): (arg1: A1, arg2: A2, arg3: A3, arg4: A4) => Navybird<T>; <T extends any[], A1, A2, A3, A4, A5>(func: (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5, callback: (err: any, ...result: T) => void) => void, options: MultiArgsPromisifyOptions): (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5) => Navybird<T>; <T>(func: (callback: (err: any, result?: T) => void) => void, options?: PromisifyOptions): () => Navybird<T>; <T, A1>(func: (arg1: A1, callback: (err: any, result?: T) => void) => void, options?: PromisifyOptions): (arg1: A1) => Navybird<T>; <T, A1, A2>(func: (arg1: A1, arg2: A2, callback: (err: any, result?: T) => void) => void, options?: PromisifyOptions): (arg1: A1, arg2: A2) => Navybird<T>; <T, A1, A2, A3>(func: (arg1: A1, arg2: A2, arg3: A3, callback: (err: any, result?: T) => void) => void, options?: PromisifyOptions): (arg1: A1, arg2: A2, arg3: A3) => Navybird<T>; <T, A1, A2, A3, A4>(func: (arg1: A1, arg2: A2, arg3: A3, arg4: A4, callback: (err: any, result?: T) => void) => void, options?: PromisifyOptions): (arg1: A1, arg2: A2, arg3: A3, arg4: A4) => Navybird<T>; <T, A1, A2, A3, A4, A5>(func: (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5, callback: (err: any, result?: T) => void) => void, options?: PromisifyOptions): (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5) => Navybird<T>; } = null as any

  /**
   * @$TypeExpand typeof attempt
   * @$$Eval (str) => str.replace(/GenericPromise/g, "Navybird")
   */
  static attempt: <T>(fn: () => T | PromiseLike<T>) => Navybird<T> = null as any

  static try = Navybird.attempt

  /**
   * @$TypeExpand typeof method
   * @$$Eval (str) => str.replace(/GenericPromise/g, "Navybird")
   */
  static method: <T, Args extends any[]>(fn: (...args: Args) => T | PromiseLike<T>) => (...args: Args) => Navybird<T> = null as any

  /**
   * @$TypeExpand typeof props
   * @$$Eval (str) => str.replace(/GenericPromise/g, "Navybird").replace(/this: PromiseConstructorLikeThis, /g, "")
   */
  static props: { <K, V>(promise: Resolvable<Map<K, Resolvable<V>>>): Navybird<Map<K, V>>; <T>(promise: Resolvable<ResolvableProps<T>>): Navybird<T>; } = null as any

  // #region Instance Methods

  /**
   * @$TypeExpand typeof caught
   * @$$Eval (str) => str.replace(/GenericPromise/g, "Navybird").replace(/promise:/g, "this:")
   */
  catch!: { <P extends PromiseLike<any>>(this: P, onReject: (error: any) => PromiseLikeValueType<P> | PromiseLike<PromiseLikeValueType<P>>): Navybird<PromiseLikeValueType<P>>; <P extends PromiseLike<any>, U>(this: P, onReject: (error: any) => U | PromiseLike<U>): Navybird<U | PromiseLikeValueType<P>>; <P extends PromiseLike<any>, E1, E2, E3, E4, E5>(this: P, filter1: CatchFilter<E1>, filter2: CatchFilter<E2>, filter3: CatchFilter<E3>, filter4: CatchFilter<E4>, filter5: CatchFilter<E5>, onReject: (error: E1 | E2 | E3 | E4 | E5) => PromiseLikeValueType<P> | PromiseLike<PromiseLikeValueType<P>>): Navybird<PromiseLikeValueType<P>>; <P extends PromiseLike<any>, U, E1, E2, E3, E4, E5>(this: P, filter1: CatchFilter<E1>, filter2: CatchFilter<E2>, filter3: CatchFilter<E3>, filter4: CatchFilter<E4>, filter5: CatchFilter<E5>, onReject: (error: E1 | E2 | E3 | E4 | E5) => U | PromiseLike<U>): Navybird<U | PromiseLikeValueType<P>>; <P extends PromiseLike<any>, E1, E2, E3, E4>(this: P, filter1: CatchFilter<E1>, filter2: CatchFilter<E2>, filter3: CatchFilter<E3>, filter4: CatchFilter<E4>, onReject: (error: E1 | E2 | E3 | E4) => PromiseLikeValueType<P> | PromiseLike<PromiseLikeValueType<P>>): Navybird<PromiseLikeValueType<P>>; <P extends PromiseLike<any>, U, E1, E2, E3, E4>(this: P, filter1: CatchFilter<E1>, filter2: CatchFilter<E2>, filter3: CatchFilter<E3>, filter4: CatchFilter<E4>, onReject: (error: E1 | E2 | E3 | E4) => U | PromiseLike<U>): Navybird<U | PromiseLikeValueType<P>>; <P extends PromiseLike<any>, E1, E2, E3>(this: P, filter1: CatchFilter<E1>, filter2: CatchFilter<E2>, filter3: CatchFilter<E3>, onReject: (error: E1 | E2 | E3) => PromiseLikeValueType<P> | PromiseLike<PromiseLikeValueType<P>>): Navybird<PromiseLikeValueType<P>>; <P extends PromiseLike<any>, U, E1, E2, E3>(this: P, filter1: CatchFilter<E1>, filter2: CatchFilter<E2>, filter3: CatchFilter<E3>, onReject: (error: E1 | E2 | E3) => U | PromiseLike<U>): Navybird<U | PromiseLikeValueType<P>>; <P extends PromiseLike<any>, E1, E2>(this: P, filter1: CatchFilter<E1>, filter2: CatchFilter<E2>, onReject: (error: E1 | E2) => PromiseLikeValueType<P> | PromiseLike<PromiseLikeValueType<P>>): Navybird<PromiseLikeValueType<P>>; <P extends PromiseLike<any>, U, E1, E2>(this: P, filter1: CatchFilter<E1>, filter2: CatchFilter<E2>, onReject: (error: E1 | E2) => U | PromiseLike<U>): Navybird<U | PromiseLikeValueType<P>>; <P extends PromiseLike<any>, E1>(this: P, filter1: CatchFilter<E1>, onReject: (error: E1) => PromiseLikeValueType<P> | PromiseLike<PromiseLikeValueType<P>>): Navybird<PromiseLikeValueType<P>>; <P extends PromiseLike<any>, U, E1>(this: P, filter1: CatchFilter<E1>, onReject: (error: E1) => U | PromiseLike<U>): Navybird<U | PromiseLikeValueType<P>>; }

  caught!: Navybird<T>['catch']

  /**
   * Like `.catch` but instead of catching all types of exceptions, it only catches those that don't originate from thrown errors but rather from explicit rejections.
   */
  error<U>(onReject: (reason: any) => U | PromiseLike<U>) {
    return this.then(null, catchIf([originatesFromRejection], onReject))
  }

  finally!: Navybird<T>['lastly']

  /**
   * @$TypeExpand typeof lastly
   * @$$Eval (str) => str.replace(/GenericPromise/g, "Navybird").replace(/promise:/g, "this:")
   */
  lastly!: <P extends PromiseLike<any>>(this: P, handler: () => any) => P

  tap<U>(onFulFill: (value: T) => Resolvable<U>) {
    const promiseConstructor = this.constructor as PromiseConstructor

    return this.then(function tapHandle(val) {
      return promiseConstructor
        .resolve(val)
        .then(onFulFill)
        .then(function tapReturnValue() {
          return val;
        });
    });
  }

  /**
   * @$TypeExpand typeof tapCatch
   * @$$Eval (str) => str.replace(/GenericPromise/g, "Navybird").replace(/promise:/g, "this:")
   */
  tapCatch!: { <P extends PromiseLike<any>, U>(this: P, onReject: (error?: any) => U | PromiseLike<U>): Navybird<PromiseLikeValueType<P>>; <P extends PromiseLike<any>, U, E1, E2, E3, E4, E5>(this: P, filter1: CatchFilter<E1>, filter2: CatchFilter<E2>, filter3: CatchFilter<E3>, filter4: CatchFilter<E4>, filter5: CatchFilter<E5>, onReject: (error: E1 | E2 | E3 | E4 | E5) => U | PromiseLike<U>): Navybird<PromiseLikeValueType<P>>; <P extends PromiseLike<any>, U, E1, E2, E3, E4>(this: P, filter1: CatchFilter<E1>, filter2: CatchFilter<E2>, filter3: CatchFilter<E3>, filter4: CatchFilter<E4>, onReject: (error: E1 | E2 | E3 | E4) => U | PromiseLike<U>): Navybird<PromiseLikeValueType<P>>; <P extends PromiseLike<any>, U, E1, E2, E3>(this: P, filter1: CatchFilter<E1>, filter2: CatchFilter<E2>, filter3: CatchFilter<E3>, onReject: (error: E1 | E2 | E3) => U | PromiseLike<U>): Navybird<PromiseLikeValueType<P>>; <P extends PromiseLike<any>, U, E1, E2>(this: P, filter1: CatchFilter<E1>, filter2: CatchFilter<E2>, onReject: (error: E1 | E2) => U | PromiseLike<U>): Navybird<PromiseLikeValueType<P>>; <P extends PromiseLike<any>, U, E1>(this: P, filter1: CatchFilter<E1>, onReject: (error: E1) => U | PromiseLike<U>): Navybird<PromiseLikeValueType<P>>; }

  delay(ms: number) {
    return this.tap(function delayValue() {
      return delay(ms);
    });
  }

  immediate() {
    return this.tap(immediate);
  }

  /**
   * @$TypeExpand typeof timeout
   * @$$Eval (str) => str.replace(/GenericPromise/g, "Navybird").replace(/promise:/g, "this:")
   */
  timeout!: { <T>(this: PromiseLike<T> | (PromiseLike<T> & { cancel(): any; }), ms: number, fallback?: string | Error): Navybird<T>; <T, R>(this: PromiseLike<T> | (PromiseLike<T> & { cancel(): any; }), ms: number, fallback: () => Resolvable<R>): Navybird<R>; }

  /**
   * @$TypeExpand typeof nodeify
   * @$$Eval (str) => str.replace(/GenericPromise/g, "Navybird").replace(/promise:/g, "this:")
   */
  nodeify!: { <P extends PromiseLike<any>>(this: P, callback: (err: any, value?: PromiseLikeValueType<P>) => void, options?: SpreadOption): P; <P extends PromiseLike<any>>(this: P, ...sink: any[]): P; }

  /**
   * @$TypeExpand typeof nodeify
   * @$$Eval (str) => str.replace(/GenericPromise/g, "Navybird").replace(/promise:/g, "this:")
   */
  asCallback!: { <P extends PromiseLike<any>>(this: P, callback: (err: any, value?: PromiseLikeValueType<P>) => void, options?: SpreadOption): P; <P extends PromiseLike<any>>(this: P, ...sink: any[]): P; }

  /**
   * @$TypeExpand typeof reflect
   * @$$Eval (str) => str.replace(/GenericPromise/g, "Navybird").replace(/promise:/g, "this:")
   */
  reflect!: <P extends PromiseLike<any>>(this: P) => Navybird<Inspection<P>>

  /**
   * @$TypeExpand typeof inspectable
   * @$$Eval (str) => str.replace(/GenericPromise/g, "Navybird").replace(/promise:/g, "this:")
   */
  inspectable!: <P extends PromiseLike<any>>(this: P) => P & Inspectable<P>

  return(): Navybird<void>;
  return<U>(value: U): Navybird<U>;
  return(value?: any) {
    return this.then(function thenReturnValue() {
      return value;
    });
  }

  thenReturn(): Navybird<void>;
  thenReturn<U>(value: U): Navybird<U>;
  thenReturn(value?: any) {
    return this.then(function thenReturnValue() {
      return value;
    });
  }

  throw(reason: Error): Navybird<never> {
    return this.then(function thenThrowReason() {
      throw reason;
    });
  }

  thenThrow(reason: Error): Navybird<never> {
    return this.then(function thenThrowReason() {
      throw reason;
    });
  }

  /**
   * @$TypeExpand typeof catchReturn
   * @$$Eval (str) => str.replace(/GenericPromise/g, "Navybird").replace(/promise:/g, "this:")
   */
  catchReturn!: { <P extends PromiseLike<any>, U>(this: P, value: U): Navybird<U | PromiseLikeValueType<P>>; <P extends PromiseLike<any>, U>(this: P, filter1: CatchFilter<Error>, filter2: CatchFilter<Error>, filter3: CatchFilter<Error>, filter4: CatchFilter<Error>, filter5: CatchFilter<Error>, value: U): Navybird<U | PromiseLikeValueType<P>>; <P extends PromiseLike<any>, U>(this: P, filter1: CatchFilter<Error>, filter2: CatchFilter<Error>, filter3: CatchFilter<Error>, filter4: CatchFilter<Error>, value: U): Navybird<U | PromiseLikeValueType<P>>; <P extends PromiseLike<any>, U>(this: P, filter1: CatchFilter<Error>, filter2: CatchFilter<Error>, filter3: CatchFilter<Error>, value: U): Navybird<U | PromiseLikeValueType<P>>; <P extends PromiseLike<any>, U>(this: P, filter1: CatchFilter<Error>, filter2: CatchFilter<Error>, value: U): Navybird<U | PromiseLikeValueType<P>>; <P extends PromiseLike<any>, U>(this: P, filter1: CatchFilter<Error>, value: U): Navybird<U | PromiseLikeValueType<P>>; }

  /**
   * @$TypeExpand typeof catchThrow
   * @$$Eval (str) => str.replace(/GenericPromise/g, "Navybird").replace(/promise:/g, "this:")
   */
  catchThrow!: { <P extends PromiseLike<any>>(this: P, reason: Error): Navybird<PromiseLikeValueType<P>>; <P extends PromiseLike<any>>(this: P, filter1: CatchFilter<Error>, filter2: CatchFilter<Error>, filter3: CatchFilter<Error>, filter4: CatchFilter<Error>, filter5: CatchFilter<Error>, reason: Error): Navybird<PromiseLikeValueType<P>>; <P extends PromiseLike<any>>(this: P, filter1: CatchFilter<Error>, filter2: CatchFilter<Error>, filter3: CatchFilter<Error>, filter4: CatchFilter<Error>, reason: Error): Navybird<PromiseLikeValueType<P>>; <P extends PromiseLike<any>>(this: P, filter1: CatchFilter<Error>, filter2: CatchFilter<Error>, filter3: CatchFilter<Error>, reason: Error): Navybird<PromiseLikeValueType<P>>; <P extends PromiseLike<any>>(this: P, filter1: CatchFilter<Error>, filter2: CatchFilter<Error>, reason: Error): Navybird<PromiseLikeValueType<P>>; <P extends PromiseLike<any>>(this: P, filter1: CatchFilter<Error>, reason: Error): Navybird<PromiseLikeValueType<P>>; }

  /**
   * Like calling `.then`, but the fulfillment value or rejection reason is assumed to be an array, which is flattened to the formal parameters of the handlers.
   */
  spread<U, Q>(this: Navybird<T & Iterable<Q>>, fulfilledHandler: (...values: Q[]) => Resolvable<U>): Navybird<U> {
    const promiseConstructor = this.constructor as typeof Navybird;
    return this.then(function spreadOnFulfilled(val) {
      if (typeof fulfilledHandler !== "function") {
        throw new errors.TypeError(`fulfilledHandler is not function`);
        // TODO: return utils.apiRejection(constants.FUNCTION_ERROR + utils.classString(fn));
      }

      const that = this;
      return promiseConstructor.all(val).then((i) => {
        return fulfilledHandler.apply(that, i);
      })
    });
  }

  /**
   * Same as calling `Promise.all(thisPromise)`.
   */
  all(this: Navybird<Iterable<{}>>): Navybird<T>;

  /**
   * Same as calling `Promise.all(thisPromise)`.
   */
  all(): Navybird<never>;

  all(): Navybird<any> {
    const args = arguments
    const promiseConstructor = this.constructor as typeof Navybird;
    return this.then(function allOnFulfilled(val: any) {
      return promiseConstructor.all.call(promiseConstructor, val, ...args);
    });
  }

  // /**
  //  * Same as calling `Promise.race(thisPromise)`.
  //  */
  // race<T>(this: Navybird<Iterable<T | PromiseLike<T>>>): Navybird<T>;
  // race<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(this: Navybird<[T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>, T9 | PromiseLike<T9>, T10 | PromiseLike<T10>]>): Navybird<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10>;
  // race<T1, T2, T3, T4, T5, T6, T7, T8, T9>(this: Navybird<[T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>, T9 | PromiseLike<T9>]>): Navybird<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9>;
  // race<T1, T2, T3, T4, T5, T6, T7, T8>(this: Navybird<[T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>]>): Navybird<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8>;
  // race<T1, T2, T3, T4, T5, T6, T7>(this: Navybird<[T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>]>): Navybird<T1 | T2 | T3 | T4 | T5 | T6 | T7>;
  // race<T1, T2, T3, T4, T5, T6>(this: Navybird<[T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>]>): Navybird<T1 | T2 | T3 | T4 | T5 | T6>;
  // race<T1, T2, T3, T4, T5>(this: Navybird<[T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>]>): Navybird<T1 | T2 | T3 | T4 | T5>;
  // race<T1, T2, T3, T4>(this: Navybird<[T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>]>): Navybird<T1 | T2 | T3 | T4>;
  // race<T1, T2, T3>(this: Navybird<[T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>]>): Navybird<T1 | T2 | T3>;
  // race<T1, T2>(this: Navybird<[T1 | PromiseLike<T1>, T2 | PromiseLike<T2>]>): Navybird<T1 | T2>;
  // race<T>(this: Navybird<(T | PromiseLike<T>)[]>): Navybird<T>;

  // race(): Navybird<any> {
  //   const args = arguments
  //   const promiseConstructor = this.constructor as typeof Navybird;
  //   return this.then(function raceOnFulfilled(val: any) {
  //     return promiseConstructor.race.call(promiseConstructor, val, ...args);
  //   });
  // }

  /**
   * Same as calling `Promise.map(thisPromise, mapper)`.
   */
  map<U, Q>(this: Navybird<T & Iterable<Q>>, mapper: (item: Q, index: number, arrayLength: number) => Resolvable<U>, options?: ConcurrencyOption): Navybird<U[]>;

  map(): Navybird<any> {
    const args = arguments
    const promiseConstructor = this.constructor as typeof Navybird;
    const promise = this as this & { [ThisBoundedSymbol]?: any };
    return promise.then(function mapOnFulfilled(val: any) {
      if (promise[ThisBoundedSymbol] && typeof args[0] === 'function') args[0] = args[0].bind(this);
      return promiseConstructor.map.call(promiseConstructor, val, ...args);
    });
  }

  /**
   * Same as calling ``Promise.mapSeries(thisPromise, iterator)``.
   */
  mapSeries<U, Q>(this: Navybird<T & Iterable<Q>>, iterator: (item: Q, index: number, arrayLength: number) => Resolvable<U>): Navybird<U[]>;

  mapSeries(): Navybird<any> {
    const args = arguments
    const promiseConstructor = this.constructor as typeof Navybird;
    const promise = this as this & { [ThisBoundedSymbol]?: any };
    return promise.then(function mapSeriesOnFulfilled(val: any) {
      if (promise[ThisBoundedSymbol] && typeof args[0] === 'function') args[0] = args[0].bind(this);
      return promiseConstructor.mapSeries.call(promiseConstructor, val, ...args);
    });
  }

  /**
   * Same as calling `Promise.reduce(thisPromise, Function reducer, initialValue)`.
   */
  reduce<U, Q>(this: Navybird<T & Iterable<Q>>, reducer: (memo: U, item: Q, index: number, arrayLength: number) => Resolvable<U>, initialValue?: U): Navybird<U>;

  reduce(): Navybird<any> {
    const args = arguments
    const promiseConstructor = this.constructor as typeof Navybird;
    const promise = this as this & { [ThisBoundedSymbol]?: any };
    return promise.then(function reduceOnFulfilled(val: any) {
      if (promise[ThisBoundedSymbol] && typeof args[0] === 'function') args[0] = args[0].bind(this);
      return promiseConstructor.reduce.call(promiseConstructor, val, ...args);
    });
  }

  /**
   * Same as calling ``Promise.each(thisPromise, iterator)``.
   */
  each<Q>(this: Navybird<T & Iterable<Q>>, iterator: (item: Q, index: number, arrayLength: number) => Resolvable<any>): Navybird<T>;

  each(): Navybird<any> {
    const args = arguments
    const promiseConstructor = this.constructor as typeof Navybird;
    const promise = this as this & { [ThisBoundedSymbol]?: any };
    return promise.then(function eachOnFulfilled(val: any) {
      if (promise[ThisBoundedSymbol] && typeof args[0] === 'function') args[0] = args[0].bind(this);
      return promiseConstructor.each.call(promiseConstructor, val, ...args);
    });
  }

  /**
   * Same as calling ``Promise.eachSeries(thisPromise, iterator)``.
   */
  eachSeries<Q>(this: Navybird<T & Iterable<Q>>, iterator: (item: Q, index: number, arrayLength: number) => Resolvable<any>): Navybird<T>;

  eachSeries(): Navybird<any> {
    const args = arguments
    const promiseConstructor = this.constructor as typeof Navybird;
    const promise = this as this & { [ThisBoundedSymbol]?: any };
    return promise.then(function eachSeriesOnFulfilled(val: any) {
      if (promise[ThisBoundedSymbol] && typeof args[0] === 'function') args[0] = args[0].bind(this);
      return promiseConstructor.eachSeries.call(promiseConstructor, val, ...args);
    });
  }

  get<U extends keyof T>(key: U): Navybird<T[U]> {
    return this.then(function getPropertyHandler(obj: any) {
      if (typeof key === 'number') {
        let index = +key;
        if (index < 0) index = Math.max(0, index + obj.length);
        return obj[index];
      } else {
        return obj[key];
      }
    })
  }

  /**
   * Same as calling `Promise.props(thisPromise)`.
   */
  props<K, V>(promise: Resolvable<Map<K, Resolvable<V>>>): Navybird<Map<K, V>>;
  props<T>(promise: Resolvable<ResolvableProps<T>>): Navybird<T>;

  props(): Navybird<any> {
    const args = arguments
    const promiseConstructor = this.constructor as typeof Navybird;
    return this.then(function propsOnFulfilled(val: any) {
      return promiseConstructor.props.call(promiseConstructor, val, ...args);
    });
  }

  // #endregion

  // #region Original Methods

  /**
   * Creates a Promise that is resolved with an array of results when all of the provided Promises
   * resolve, or rejected when any Promise is rejected.
   * @param values An array of Promises.
   * @returns A new Promise.
   * 
   * @$TypeExpand PromiseConstructor['all']
   * @$$Eval (str) => str.replace(/: Promise</g, ": Navybird<")
   */
  static all: { <TAll>(values: Iterable<TAll | PromiseLike<TAll>>): Navybird<TAll[]>; <T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>, T9 | PromiseLike<T9>, T10 | PromiseLike<T10>]): Navybird<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]>; <T1, T2, T3, T4, T5, T6, T7, T8, T9>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>, T9 | PromiseLike<T9>]): Navybird<[T1, T2, T3, T4, T5, T6, T7, T8, T9]>; <T1, T2, T3, T4, T5, T6, T7, T8>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>]): Navybird<[T1, T2, T3, T4, T5, T6, T7, T8]>; <T1, T2, T3, T4, T5, T6, T7>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>]): Navybird<[T1, T2, T3, T4, T5, T6, T7]>; <T1, T2, T3, T4, T5, T6>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>]): Navybird<[T1, T2, T3, T4, T5, T6]>; <T1, T2, T3, T4, T5>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>]): Navybird<[T1, T2, T3, T4, T5]>; <T1, T2, T3, T4>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>]): Navybird<[T1, T2, T3, T4]>; <T1, T2, T3>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>]): Navybird<[T1, T2, T3]>; <T1, T2>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>]): Navybird<[T1, T2]>; <T>(values: (T | PromiseLike<T>)[]): Navybird<T[]>; };

  /**
   * Creates a Promise that is resolved or rejected when any of the provided Promises are resolved
   * or rejected.
   * @param values An array of Promises.
   * @returns A new Promise.
   *
   * @$TypeExpand PromiseConstructor['race']
   * @$$Eval (str) => str.replace(/: Promise</g, ": Navybird<")
   */
  static race: { <T>(values: Iterable<T | PromiseLike<T>>): Navybird<T>; <T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>, T9 | PromiseLike<T9>, T10 | PromiseLike<T10>]): Navybird<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10>; <T1, T2, T3, T4, T5, T6, T7, T8, T9>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>, T9 | PromiseLike<T9>]): Navybird<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9>; <T1, T2, T3, T4, T5, T6, T7, T8>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>]): Navybird<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8>; <T1, T2, T3, T4, T5, T6, T7>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>]): Navybird<T1 | T2 | T3 | T4 | T5 | T6 | T7>; <T1, T2, T3, T4, T5, T6>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>]): Navybird<T1 | T2 | T3 | T4 | T5 | T6>; <T1, T2, T3, T4, T5>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>]): Navybird<T1 | T2 | T3 | T4 | T5>; <T1, T2, T3, T4>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>]): Navybird<T1 | T2 | T3 | T4>; <T1, T2, T3>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>]): Navybird<T1 | T2 | T3>; <T1, T2>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>]): Navybird<T1 | T2>; <T>(values: (T | PromiseLike<T>)[]): Navybird<T>; }

  /**
   * Creates a new rejected promise for the provided reason.
   * @param reason The reason the promise was rejected.
   * @returns A new rejected Promise.
   *
   * @$TypeExpand PromiseConstructor['reject']
   * @$$Eval (str) => str.replace(/ Promise</g, " Navybird<")
   */
  static reject: <T = never>(reason?: any) => Navybird<T>;

  static resolve: {
    /**
     * Creates a new resolved promise for the provided value.
     * @param value A promise.
     * @returns A promise whose internal state matches the provided promise.
     */
    <T>(value: T | PromiseLike<T>): Navybird<T>
    /**
     * Creates a new resolved promise .
     * @returns A resolved promise.
     */
    (): Navybird<void>
  };

  /**
   * Attaches callbacks for the resolution and/or rejection of the Promise.
   * @param onfulfilled The callback to execute when the Promise is resolved.
   * @param onrejected The callback to execute when the Promise is rejected.
   * @returns A Promise for the completion of which ever callback is executed.
   */
  then!: {
    <TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Navybird<TResult1 | TResult2>
  };

  // #endregion


  // #region Dummy Methods

  static config(...arg: any[]) { }

  static hasLongStackTraces() { return false }
  static longStackTraces() { }

  static onPossiblyUnhandledRejection(...arg: any[]) { }

  // #endregion

  static cast: typeof Navybird['resolve'] = Navybird.resolve
  static fulfilled: typeof Navybird['resolve'] = Navybird.resolve
  static rejected: typeof Navybird['reject'] = Navybird.reject
  static pending: typeof Navybird['defer'] = Navybird.defer

  static getNewLibraryCopy = getNewLibraryCopy

  static default = Navybird
  static Navybird = Navybird
  static Bluebird = Navybird
  static Promise = Navybird

  static Defer = Defer
  static NavybirdDefer = Defer
  static PromiseInspection = Inspection

  static TypeError = errors.TypeError
  static OperationalError = errors.OperationalError
  static TimeoutError = errors.TimeoutError
  static AggregateError = errors.AggregateError
}

rebindClass(Navybird);
Object.keys(Navybird).forEach(function (key: Extract<keyof typeof Navybird, string>) {
  notEnumerableProp(Navybird, key, Navybird[key]);
});

export interface NavybirdDefer<T> extends Defer<T> {
  readonly promise: Navybird<T>
}

let instance = 0;
export function getNewLibraryCopy(): typeof Navybird {
  const instanceNumber = instance++
  const Newbird: typeof Navybird = class Navybird<T> extends Promise<T> { } as any

  const rootProperties = Object.getOwnPropertyDescriptors(Navybird)
  const functionProperties = {
    name: rootProperties.name,
    length: rootProperties.length
  }

  delete rootProperties.prototype;
  delete rootProperties.name;
  delete rootProperties.length;
  Object.defineProperties(Newbird, rootProperties);

  if (functionProperties.name) {
    if (instanceNumber > 0) {
      functionProperties.name.value = `Navybird${instanceNumber}`;
    }
  } else delete functionProperties.name;
  if (!functionProperties.length) delete functionProperties.length;
  Object.defineProperties(Newbird, functionProperties);

  const prototypeProperties = Object.getOwnPropertyDescriptors(Navybird.prototype)
  delete prototypeProperties.constructor;
  Object.defineProperties(Newbird.prototype, prototypeProperties);

  rebindClass(Newbird);

  return Newbird
}

function rebindClass(Newbird: typeof Navybird) {
  Newbird.default = Newbird
  Newbird.Navybird = Newbird
  Newbird.Bluebird = Newbird
  Newbird.Promise = Newbird

  rebindPrototypeMethods(Newbird)
  rebindClassMethods(Newbird)
}

function rebindPrototypeMethods(Newbird: typeof Navybird) {
  for (const [name, func] of [
    ["timeout", timeout],
    ["lastly", lastly],
    ["nodeify", nodeify],
    ["catch", caught],
    ["catchReturn", catchReturn],
    ["catchThrow", catchThrow],
    ["tapCatch", tapCatch],
    ["reflect", reflect],
    ["inspectable", inspectable],
  ] as const) {
    Newbird.prototype[name] = function () {
      return func.call(this.constructor, this, ...arguments);
    } as any
  }

  Newbird.prototype.finally = Newbird.prototype.lastly;
  Newbird.prototype.caught = Newbird.prototype.catch;
  Newbird.prototype.asCallback = Newbird.prototype.nodeify;
}

function rebindClassMethods(Newbird: typeof Navybird) {
  for (const [name, func] of [
    ["defer", defer],
    ["delay", delay],
    ["eachSeries", eachSeries],
    ["immediate", immediate],
    ["fromCallback", fromCallback],
    ["join", join],
    ["map", map],
    ["mapSeries", mapSeries],
    ["reduce", reduce],
    ["promisify", promisify],
    ["props", props],
    ["attempt", attempt],
    ["method", method],

    ["resolve", nativePromiseMethods.resolve],
    ["reject", nativePromiseMethods.reject],
    ["all", nativePromiseMethods.all],
    ["race", nativePromiseMethods.reject],
  ] as const) {
    Newbird[name] = function (this: any) {
      let promiseConstructor = Newbird;
      if (this && typeof this === 'function' && this.resolve && this.prototype && this.prototype.then) {
        promiseConstructor = this;
      }
      return func.apply(promiseConstructor, arguments);
    } as any
  }

  Newbird.resolve.prototype = Newbird;

  Newbird.cast = Newbird.resolve
  Newbird.fulfilled = Newbird.resolve
  Newbird.rejected = Newbird.reject
  Newbird.pending = Newbird.defer
  Newbird.each = Newbird.eachSeries
  Newbird.fromNode = Newbird.fromCallback
  Newbird.try = Newbird.attempt
}