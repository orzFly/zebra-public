import { NodeFS, patchFs as fslibPatchFs, PosixFS, ZipOpenFS } from '@yarnpkg/fslib';
import { getLibzipSync } from '@yarnpkg/libzip';
import fs from 'fs';
import { patchRequireWithFs } from './patchRequireWithFs';
import { ZipDirFS } from './ZipDirFS';

const libzip = getLibzipSync();

const original = libzip.name.locate;
libzip.name.locate = function (...args: any[]) {
  if (typeof args[1] === 'string' && args[1].startsWith("/")) args[1] = args[1].slice(1);
  return original.apply(this, args);
}

export const realFs: typeof fs = { ...fs };
const nodeFs = new NodeFS(realFs)
const zipOpenFs = new ZipOpenFS({
  baseFs: nodeFs,
  libzip: libzip,
  useCache: true,
  maxOpenFiles: 80,
  readOnlyArchives: true,
});

const proxiedFs = new PosixFS(new ZipDirFS(zipOpenFs))

export const patchedFs: typeof fs = { ...fs };
fslibPatchFs(patchedFs, proxiedFs);

let fsPatched = false;
export const realFsSymbol = Symbol.for("realFs");
export function patchFs() {
  if (fsPatched) return;

  fslibPatchFs(fs, proxiedFs);
  Object.defineProperty(fs, realFsSymbol, {
    configurable: true,
    enumerable: false,
    writable: true,
    value: realFs
  });

  fsPatched = true;
};

let requirePatched = false;
export function patchRequire() {
  if (requirePatched) return;

  patchRequireWithFs(patchedFs);
  requirePatched = true;
}

export function register() {
  patchFs();
  patchRequire();
}

if (!process.mainModule) register();
