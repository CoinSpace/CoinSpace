var fs = require('fs')
var cp = require('child_process')

task = process.argv.reduce(function(memo, arg) {
  if(memo === false && arg.match(/build/)) {
    return null
  }
  if(memo === null) {
    return arg
  }
  return memo
}, false) || 'dev'

if(task.indexOf('help') >= 0) {
  return console.log("Available build tasks: " + Object.keys(require('./tasks')).sort().join(', '))
}

if(task === 'build') {
  var children = collectTasks()
  initTasks(children)
  runTasks(children)
} else {
  var child = cp.fork('./tasks')
  child.send(task)
  if (task !== 'serve' && task !== 'watch') {
    child.on('message', process.exit)
  }
}

function collectTasks() {
  var tasks = fs.readdirSync('./app/lib/i18n/translations').map(function(f){
    return f.replace('.json', '')
  }).map(function(language) {
    process.env.LANGUAGE = language
    var scripts = cp.fork('./tasks', {env: process.env})
    return [scripts, ['scripts', 'loaderNope']]
  })
  delete process.env.LANGUAGE

  var others = cp.fork('./tasks')
  tasks.push([others, ['html', 'styles', 'images', 'fonts', 'loaderIndex']])

  return tasks;
}

function initTasks(children) {
  children.forEach(function(pair) {
    var child = pair[0]
    child.on('message', maybeDone)
  })

  var childCount = children.length
  function maybeDone() {
    childCount--

    if(children.length > 0) {
      var next = children.splice(0, 1)[0]
      next[0].send(next[1])
    } else if(childCount === 0){
      process.exit()
    }
  }
}

function runTasks(children) {
  var processCount = process.env.PROCESS_COUNT || 4
  console.info('Max number of concurrent build processes:', processCount)

  children.splice(0, processCount).forEach(function(pair){
    pair[0].send(pair[1])
  })
}

