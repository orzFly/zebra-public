import * as fs from 'fs';
import * as path from 'path';

// tslint:disable: only-arrow-functions
// tslint:disable: cyclomatic-complexity
// tslint:disable: prefer-template
// tslint:disable: prefer-for-of

const isWin32 = process.platform === 'win32';

/**
 * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
 * because the buffer-to-string conversion in `fs.readFileSync()`
 * translates it to FEFF, the UTF-16 BOM.
 */
function stripBOM(content: string) {
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  return content;
}

/**
 * Rewrites `modules.js`, which is the factory for the `require` function.
 * You give this function your custom file system object and this function
 * will patch `module.js` to use that instead of the built-it `fs.js` file system.
 *
 * This function expects an object with three methods:
 *
 *     patchRequire({
 *         readFileSync: () => {},
 *         realpathSync: () => {},
 *         statSync: () => {},
 *     });
 *
 * The methods should behave like the ones on the native `fs` object.
 */
export function patchRequireWithFs(vol: {
  readFileSync: (typeof fs)['readFileSync'],
  realpathSync: (typeof fs)['realpathSync'],
  statSync: (typeof fs)['statSync'],
}, Module = require('module')) {

  // Used to speed up module loading.  Returns the contents of the file as
  // a string or undefined when the file cannot be opened.  The speedup
  // comes from not creating Error objects on failure.
  function internalModuleReadFile(path: string) {
    try {
      return vol.readFileSync(path, 'utf8');
    } catch (err) {
      return undefined;
    }
  }

  // Used to speed up module loading.  Returns 0 if the path refers to
  // a file, 1 when it's a directory or < 0 on error (usually -ENOENT.)
  // The speedup comes from not creating thousands of Stat and Error objects.
  function internalModuleStat(filename: string) {
    try {
      return vol.statSync(filename).isDirectory() ? 1 : 0;
    } catch (err) {
      return -2; // ENOENT
    }
  }

  function stat(filename: string) {
    filename = path.toNamespacedPath(filename);
    const cache = stat.cache;
    if (cache !== null) {
      const result = cache.get(filename);
      if (result !== undefined) return result;
    }
    const result = internalModuleStat(filename);
    if (cache !== null) cache.set(filename, result);
    return result;
  }
  stat.cache = new Map<string, any>();


  const preserveSymlinks = false;

  function toRealPath(requestPath: string) {
    return vol.realpathSync(requestPath);
  }


  const packageMainCache = Object.create(null);
  function readPackage(requestPath: string) {
    const entry = packageMainCache[requestPath];
    if (entry) {
      return entry;
    }

    const jsonPath = path.resolve(requestPath, 'package.json');
    const json = internalModuleReadFile(path.toNamespacedPath(jsonPath));

    if (json === undefined) {
      return false;
    }

    let pkg;
    try {
      pkg = packageMainCache[requestPath] = JSON.parse(json).main;
    } catch (e) {
      e.path = jsonPath;
      e.message = 'Error parsing ' + jsonPath + ': ' + e.message;
      throw e;
    }
    return pkg;
  }


  function tryFile(requestPath: string, isMain: boolean) {
    const rc = stat(requestPath);
    if (preserveSymlinks && !isMain) {
      return rc === 0 && path.resolve(requestPath);
    }
    return rc === 0 && toRealPath(requestPath);
  }


  // given a path check a the file exists with any of the set extensions
  function tryExtensions(p: string, exts: string[], isMain: boolean) {
    for (let i = 0; i < exts.length; i++) {
      const filename = tryFile(p + exts[i], isMain);

      if (filename) {
        return filename;
      }
    }
    return false;
  }


  function tryPackage(requestPath: string, exts: string[], isMain: boolean) {
    const pkg = readPackage(requestPath);

    if (!pkg) return false;

    const filename = path.resolve(requestPath, pkg);
    return tryFile(filename, isMain) ||
      tryExtensions(filename, exts, isMain) ||
      tryExtensions(path.resolve(filename, 'index'), exts, isMain);
  }


  // Native extension for .js
  Module._extensions['.js'] = function (module: any, filename: string) {
    const content = vol.readFileSync(filename, 'utf8');
    module._compile(stripBOM(content), filename);
  };

  // Native extension for .json
  Module._extensions['.json'] = function (module: any, filename: string) {
    const content = vol.readFileSync(filename, 'utf8');
    try {
      module.exports = JSON.parse(stripBOM(content));
    } catch (err) {
      err.message = filename + ': ' + err.message;
      throw err;
    }
  };

  Module._findPath = function (request: string, paths: string[], isMain: boolean) {
    if (path.isAbsolute(request)) {
      paths = [''];
    } else if (!paths || paths.length === 0) {
      return false;
    }

    const cacheKey = request + '\x00' +
      (paths.length === 1 ? paths[0] : paths.join('\x00'));
    const entry = Module._pathCache[cacheKey];
    if (entry) {
      return entry;
    }

    let exts;
    const trailingSlash = request.length > 0 &&
      (request.charCodeAt(request.length - 1) === 47/*/*/ ||
      isWin32 && request.charCodeAt(request.length - 1) === 92 /*\*/);

    // For each path
    for (let i = 0; i < paths.length; i++) {
      // Don't search further if path doesn't exist
      const curPath = paths[i];
      if (curPath && stat(curPath) < 1) continue;
      const basePath = path.resolve(curPath, request);
      let filename;

      const rc = stat(basePath);
      if (!trailingSlash) {
        if (rc === 0) {  // File.
          if (preserveSymlinks && !isMain) {
            filename = path.resolve(basePath);
          } else {
            filename = toRealPath(basePath);
          }
        } else if (rc === 1) {  // Directory.
          if (exts === undefined) {
            exts = Object.keys(Module._extensions);
          }
          filename = tryPackage(basePath, exts, isMain);
        }

        if (!filename) {
          // try it with each of the extensions
          if (exts === undefined) {
            exts = Object.keys(Module._extensions);
          }
          filename = tryExtensions(basePath, exts, isMain);
        }
      }

      if (!filename && rc === 1) {  // Directory.
        if (exts === undefined) {
          exts = Object.keys(Module._extensions);
        }
        filename = tryPackage(basePath, exts, isMain);
      }

      if (!filename && rc === 1) {  // Directory.
        // try it with each of the extensions at "index"
        if (exts === undefined) {
          exts = Object.keys(Module._extensions);
        }
        filename = tryExtensions(path.resolve(basePath, 'index'), exts, isMain);
      }

      if (filename) {
        Module._pathCache[cacheKey] = filename;
        return filename;
      }
    }
    return false;
  };
}
