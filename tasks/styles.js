var sass = require('node-sass')
var autoprefixer = require('autoprefixer')
var fs = require('fs')
var done = require('./util').done
var prepareDir = require('./util').prepareDir

function styles(callback) {
  var inFile = './app/application.scss'
  var outFile = './build/assets/css/application.css'
  var cb = done(inFile, 'compilation', callback)

  prepareDir(outFile, function(err){
    if(err) return cb(err);

    sass.render({
      file: inFile,
      success: function(css){
        var prefixed = autoprefixer.process(css).css
        fs.writeFile(outFile, prefixed, cb)
      },
      error: cb
    })
  })
}

module.exports = styles
