const Path = require('path');

function addNodeOptionsRequire(filename) {
  if (!process.versions || !process.versions.node) {
    throw new Error('Cannot find node version in process.versions.node!');
  }
  const majorNodeVersion = Number(process.versions.node.split(".")[0])

  let newOptions = process.env.NODE_OPTIONS || '';
  if (filename.indexOf(" ") >= 0 || filename.indexOf('"') >= 0) {
    if (majorNodeVersion >= 12) {
      filename = filename
        .replace(/"/g, '"\\"')
        .replace(/ /g, '" "')
    } else {
      throw new Error("Use Node >= 12 or remove spaces and quotes in path!")
    }
  }
  newOptions += ` -r ${filename}`;

  process.env.NODE_OPTIONS = newOptions
}

function lastNodeModules(s) {
  const magic = Path.sep + "node_modules" + Path.sep;
  const pos = s.lastIndexOf(magic)
  if (pos >= 0) return s.slice(0, pos + magic.length)
  return null
}

module.exports = { addNodeOptionsRequire, lastNodeModules }
