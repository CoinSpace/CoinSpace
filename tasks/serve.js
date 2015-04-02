var buildServer = require('../server/express')
var done = require('./util').done


function serve(callback) {
  var serverport = 8080
  var server = buildServer()
  server.listen(serverport)

  done('server', 'start', callback)()
}

module.exports = serve
