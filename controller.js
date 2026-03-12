// Webpack 4 / CRA 4 compatibility shim.
// Modern bundlers (webpack 5+) use the "exports" field in package.json and
// never load this file.  Webpack 4 does not understand "exports", so it
// resolves @exotel-npm-dev/exotel-ai-assist/controller to this CJS file directly.
module.exports = require("./dist/controller/index.js");
