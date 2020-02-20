const Path = require('path');
const Module = require('module');

const tslintLocation = require("./env").lastNodeModules(require.resolve("tslint")) + "tslint";

const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  if (request === "tslint" || request.startsWith("tslint" + Path.sep)) {
    return originalResolve.call(this, tslintLocation + request.slice(6, 0), ...args)
  }
  return originalResolve.call(this, request, ...args)
}

