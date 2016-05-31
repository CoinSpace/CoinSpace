"use strict"

var app = require('./express')()
var http = require('http')
var geo = require('./geo')

var server = http.createServer(app)
server.listen(process.env.PORT || 9009, function() {
  console.info('server listening on http://localhost:' + server.address().port)
})

var interval = 60 * 60 * 1000 // 1 hour
setInterval(function(){
  geo.getIdsOlderThan(interval, function(err, docs) {
    if (err) return console.error(err);
    console.info('removing old geo docs: ' + docs.length);
    docs.forEach(geo.remove);
  });
}, interval)

