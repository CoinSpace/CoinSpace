var watch = require('glob-watcher')
var request = require('request')
var styles = require('./styles')
var loader = require('./loader')
var test = require('./test')
var scripts = require('./scripts')
var images = require('./images')
var html = require('./html')
var lrserver = require('tiny-lr')()

var livereloadport = 35729

function watcher(callback) {
  lrserver.listen(livereloadport)

  watch(['app/**/*.scss'], styles)
  watch(['app/**/*.js', 'app/**/*.json', 'app/**/*.ract', '!app/**/node_modules/**/*', '!app/loader/**'], function(event){
    scripts()
    test()
  })
  watch(['app/loader/**/*.js'], function(){
    loader()
    test()
  })
  watch(['app/assets/img/*'], images)
  watch('app/index.html', html)
  watch(['app/**/test/*.js', '!app/**/node_modules/**/*'], test)
  watch('build/**/*', function(event){
    refresh(event.path.replace(process.cwd() + '/build', ''))
  })
}

function refresh(filename) {
  request('http://localhost:' + livereloadport + "/changed?files=" + filename, function(){
    console.log("notified client to reload", filename)
  })
}

module.exports = watcher
