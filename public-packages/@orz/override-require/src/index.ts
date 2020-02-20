import Module from 'module';
import Path from 'path';

function ensureEndWithDirSep(path: string) {
  if (path.endsWith(Path.sep)) return path;
  return path + Path.sep;
}

function getModuleBasePath(require: NodeRequire, module: string) {
  let basePath = require.resolve(module)

  do {
    const baseName = Path.basename(basePath)
    const parentPath = Path.dirname(basePath)
    if (!parentPath || parentPath === basePath) throw new Error('Invalid parent found in getModuleBasePath')

    const parentName = Path.basename(parentPath)

    if (parentName === 'node_modules' && baseName === module) {
      return basePath
    }

    basePath = parentPath
  } while (true)
}

export function overrideRequireWithMyDependencies(
  require: NodeRequire,
  module: string,
  dependencies: string[],
) {
  const originalModule = (Module as any)._resolveFilename
  const basePath = ensureEndWithDirSep(getModuleBasePath(require, module));

  (Module as any)._resolveFilename = function (request: string, parent: any) {
    if (parent && parent.filename && parent.filename.startsWith(basePath)) {
      if (dependencies.includes(request.split("/")[0])) {
        return require.resolve(request)
      }
    }
    return originalModule.apply(this, arguments);
  }
}
