var glob = require('glob')
var bundle = require('./util').bundle

function test(callback) {
  bundle(glob.sync("./app/@(widgets|lib)/*/test/*"), './build/assets/js/tests/index.js', callback)
}

module.exports = test
