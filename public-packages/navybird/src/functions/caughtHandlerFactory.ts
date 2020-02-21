import { catchIf } from './catchIf';

const noop = function <T>(a: T) { return a; };
export function caughtHandlerFactory(args: any[], handler?: (a: any) => (a: any) => any) {
  if (!handler) handler = noop;

  if (args.length > 1) {
    return catchIf(args.slice(0, args.length - 1), handler(args[args.length - 1]));
  }
  return handler(args[0]);
}