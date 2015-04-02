var exec = require('child_process').exec
var done = require('./util').done

function sketch(callback) {
  var inFile = './app/assets-master.sketch'
  var outFolder = './app/assets/img/'
  var cb = done(outFolder, 'scketch export', callback)

  exec("sketchtool export artboards " + inFile + " --output=" + outFolder, cb)
}

module.exports = sketch
