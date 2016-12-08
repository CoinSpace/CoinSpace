"use strict"

var app = require('./express')()
var http = require('http')
var geo = require('./geo')
var fee = require('./fee')

var server = http.createServer(app)
server.listen(process.env.PORT || 9009, function() {
  console.info('server listening on http://localhost:' + server.address().port)
})

var geoInterval = 60 * 60 * 1000 // 1 hour
setInterval(function(){
  geo.getIdsOlderThan(geoInterval, function(err, docs) {
    if (err) return console.error(err);
    console.info('removing old geo docs: ' + docs.length);
    docs.forEach(geo.remove);
  });
}, geoInterval)

var feeInterval = 10 * 60 * 1000 // 10 minutes
setInterval(function cacheFee() {
  fee.getFromAPI(function(err, data) {
    if (err) return console.error(err);
    if (!data.hourFee || !data.fastestFee) return console.error('Bad response', data);
    fee.save({hour: data.hourFee, fastest: data.fastestFee})
    if (global.gc) global.gc();
  });
  return cacheFee;
}(), feeInterval);