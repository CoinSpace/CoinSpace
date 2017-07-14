"use strict"

var app = require('./express')()
var http = require('http')
var master = require('./master')

var server = http.createServer(app)
server.listen(process.env.PORT || 9009, function() {
  console.info('server listening on http://localhost:' + server.address().port)
})

if (process.env.MASTER) {
  master.cleanGeo(60 * 60 * 1000) // 1 hour
  master.cacheFees(60 * 60 * 1000) // 1 hour
  master.cacheTicker(60 * 60 * 1000) // 1 hour
}
