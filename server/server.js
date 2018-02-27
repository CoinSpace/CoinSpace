"use strict"

var app = require('./express')()
var master = require('./master')
var db = require('./db');

db().then(function() {
  var port = process.env.PORT || 8080;
  var server = app.listen(port, function() {
    console.info('server listening on http://localhost:' + server.address().port)
    server.timeout = 30000; // 30 sec
  });
}).catch(function(error) {
  console.log('error', error);
});

if (process.env.MASTER) {
  master.cleanGeo(60 * 60 * 1000) // 1 hour
  master.cacheFees(60 * 60 * 1000) // 1 hour
  master.cacheTicker(60 * 60 * 1000) // 1 hour
}
