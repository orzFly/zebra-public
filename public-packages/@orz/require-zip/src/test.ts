import { npath, ppath, toFilename, ZipFS } from '@yarnpkg/fslib';
import { getLibzipSync } from '@yarnpkg/libzip';
import { register } from '.';

// tslint:disable: no-console

function rescue<T, R = null>(func: () => T, defaultValue: R = null as any): T | R {
  try {
    return func();
  } catch (e) {
    return defaultValue;
  }
}

const path = ppath.resolve(npath.toPortablePath(npath.resolve(__dirname, "..")), toFilename("test.zip"))

const packageName = npath.resolve(npath.fromPortablePath(path), "index.js")
console.log(packageName)

console.log(rescue(() => require(packageName), "failed"))

const zip = new ZipFS(path, { libzip: getLibzipSync(), create: true });
zip.writeFileSync(zip.pathUtils.resolve("/package.json" as any), `{"type":"commonjs"}`);
zip.writeFileSync(zip.pathUtils.resolve("/index.js" as any), "module.exports = 233");
zip.saveAndClose();

register();

console.log(rescue(() => require(packageName), "failed"))
