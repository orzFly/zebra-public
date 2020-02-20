#!/usr/bin/env node

require('../helper/env').addNodeOptionsRequire(require.resolve(`@yarnpkg/pnpify`));
require(`@yarnpkg/pnpify`).patchFs();

const bin = require(`ts-node/dist/bin.js`);
module.exports = bin;
bin.main([...process.argv.slice(2)]);
