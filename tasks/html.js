var fs = require('fs')
var copy = require('./util').copy
var isProduction = require('./util').isProduction

function html(callback) {
  var cb = isProduction() ? callback : injectLivereloadScript(callback)
  copy('./app/index.html', './build/', cb)
}

function injectLivereloadScript(callback) {
  return function(){
    var filename = './build/index.html'
    fs.readFile(filename, { encoding: 'utf8' }, function(err, index){
      if(err) return callback(err);

      var replacement = '<script src="http://127.0.0.1:35729/livereload.js"></script>\n</body>'
      fs.writeFile(filename, index.replace('</body>', replacement), callback)
    })
  }
}

module.exports = html
