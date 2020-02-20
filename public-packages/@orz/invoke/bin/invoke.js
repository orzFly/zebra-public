#!/usr/bin/env node

let invokePath
function tryRequire(lib) {
  try { invokePath = require.resolve(lib) } catch (e) { }
  if (!invokePath) return undefined;
  return require(lib);
}

const lib = (() => {
  const env1 = process.env.ORZ_INVOKE_BIN_PATH
  const env2 = process.env.ORZ_INVOKE_FALLBACK_BIN_PATH
  return null ||
    (env1 && tryRequire(env1)) ||
    tryRequire('../dist-dev') ||
    tryRequire('../lib') ||
    tryRequire('../dist') ||
    (env2 && tryRequire(env2)) ||
    (() => { throw new Error('Cannot find usable invoke lib!') })()
})()

lib.cli({ invokePath: invokePath });