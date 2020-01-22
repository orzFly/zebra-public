const relPnpApiPath = "../../../../.pnp.js";
const absPnpApiPath = require(`path`).resolve(__dirname, relPnpApiPath);

// Setup the environment to be able to require typescript/lib/tsserver
require(absPnpApiPath).setup();

// Prepare the environment (to be ready in case of child_process.spawn etc)
require(`@orz/typescript/helper/env`).addNodeOptionsRequire(absPnpApiPath);

// Defer to the real typescript/lib/tsserver your application uses
module.exports = require(`@orz/typescript/bin/tsserver`);
