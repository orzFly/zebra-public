import { isPrimitive } from './isPrimitive';

export function notEnumerableProp(obj: object, name: string, value: any) {
  if (isPrimitive(obj)) return obj;

  const descriptor = {
    value: value,
    configurable: true,
    enumerable: false,
    writable: true,
  };
  Object.defineProperty(obj, name, descriptor);
  return obj;
}