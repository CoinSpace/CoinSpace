var buildServer = require('../server/express')
var master = require('../server/master')
var done = require('./util').done


function serve(callback) {
  var serverport = 8080
  var server = buildServer()
  server.listen(serverport)

  done('server', 'start', callback)()

  if (process.env.MASTER) {
    master.cleanGeo(60 * 60 * 1000) // 1 hour
    master.cacheFees(60 * 60 * 1000) // 1 hour
    master.cacheTicker(60 * 60 * 1000) // 1 hour
  }
}

module.exports = serve
