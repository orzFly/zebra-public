#!/usr/bin/env node

require('../helper/env').addNodeOptionsRequire(require.resolve(`@yarnpkg/pnpify`));
require(`@yarnpkg/pnpify`).patchFs();

module.exports = require(`ts-node/dist/script.js`);
