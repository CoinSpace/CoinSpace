var async = require('async')

var tasks = {
  serve: require('./serve'),
  images: require('./images'),
  html: require('./html'),
  styles: require('./styles'),
  scripts: require('./scripts'),
  loader: require('./loader').loader,
  loaderIndex: require('./loader').index,
  loaderNope: require('./loader').nope,
  test: require('./test'),
  sketch: require('./sketch'),
  watch: require('./watch'),
  transifexPull: require('./transifex').pull,
  transifexPush: require('./transifex').push
}

tasks.dev = function(){
  async.parallel([ tasks.scripts, tasks.loader, tasks.html, tasks.styles, tasks.images ], function(){
    tasks.watch()
    tasks.serve()
    tasks.test()
  })
}

module.exports = tasks

process.on('message', function(task){
  if(typeof task === 'string') task = [task]
  task = task.map(function(t){
    return tasks[t]
  })

  async.parallel(task, function(err){
    if(err) {
      console.error(err.message)
      console.error(err.stack)
    }
    process.send('done')
  })
})
