#!/usr/bin/env node

const envHelper = require('../helper/env');

envHelper.addNodeOptionsRequire(require.resolve(`@yarnpkg/pnpify`));
envHelper.addNodeOptionsRequire(require.resolve('../helper/register-tslint'));

const pluginProbeLocations = [
  envHelper.lastNodeModules(require.resolve("typescript-tslint-plugin"))
].filter((i) => i);

if (pluginProbeLocations.length > 0) {
  const magic = "--pluginProbeLocations"
  const pos = process.argv.indexOf(magic)
  if (pos >= 2 && pos < process.argv.length - 1) {
    process.argv[pos + 1] = [
      ...pluginProbeLocations,
      ...process.argv[pos + 1].split(","),
    ].join(",")
  } else {
    process.argv.splice(2, 0, [
      magic,
      pluginProbeLocations.join(",")
    ])
  }
}

require(`@yarnpkg/pnpify`).patchFs();

module.exports = require(`typescript/bin/tsserver`);
