var fs = require('fs')
var path = require('path')
var cpr = require('cpr')
var browserify = require('browserify')
var mkdirp = require('mkdirp')

function copy(from, to, callback){
  cpr(from, to, {
    deleteFirst: true,
    overwrite: true
  }, done(from, 'copy', callback))
}

function bundle(inFile, outFilename, callback){
  var bundler = browserify(inFile)

  // transforms
  bundler = bundler.transform('ractify')
  if(isProduction()) {
    bundler = bundler.transform({global: true}, 'uglifyify')
  }

  // bundle
  prepareDir(outFilename, function(err){
    if(err) return cb(err);

    if(fs.existsSync(outFilename)) {
      fs.unlinkSync(outFilename)
    }

    var dest = fs.createWriteStream(outFilename);
    bundler.bundle()
      .on('error', done(outFilename, 'compilation', callback))
      .on('end', done(outFilename, 'compilation', callback))
      .pipe(dest)
  })
}

function prepareDir(filename, callback){
  mkdirp(path.dirname(filename), callback)
}

function done(filename, action, next){
  return function(err) {
    if(err) {
      console.error(filename, action, "failed")
      console.error(err);
      console.error(err.message);
      console.error(err.stack)
    } else {
      console.log(filename, action, "succeeded")
    }

    if(typeof next === 'function') next(err)
  }
}

function isProduction(){
  return process.env.NODE_ENV === "production"
}

module.exports = {
  bundle: bundle,
  copy: copy,
  prepareDir: prepareDir,
  done: done,
  isProduction: isProduction
}

