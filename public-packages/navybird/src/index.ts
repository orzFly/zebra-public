import * as errors from './errors';
import { Inspection } from './functions/inspectable';
import { getNewLibraryCopy, Navybird as RootNavybird, NavybirdDefer as RootNavybirdDefer } from "./Navybird";

const Navybird = getNewLibraryCopy()

declare namespace Navybird {
  export type Navybird<T> = RootNavybird<T>;
  export type Bluebird<T> = RootNavybird<T>;
  export type Promise<T> = RootNavybird<T>;

  export type Defer<T> = RootNavybirdDefer<T>;
  export type NavybirdDefer<T> = RootNavybirdDefer<T>;
  export type PromiseInspection<P extends PromiseLike<any>> = Inspection<P>;

  export type TypeError = typeof errors.TypeError;
  export type OperationalError = typeof errors.OperationalError;
  export type TimeoutError = typeof errors.TimeoutError;
 
}

export = Navybird;