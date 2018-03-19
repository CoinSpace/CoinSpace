'use strict';

var express = require('express');
var middleware = require('./middleware');

var api = require('./lib/v1/api');
var legacyApi = require('./lib/legacy/api');
var app = express();

var master = require('./lib/v1/master');
var db = require('./lib/v1/db');

middleware.init(app);

// API routes
app.use('', legacyApi);
app.use('/api/v1', api);

app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send({error: 'Oops! something went wrong.'});
});

app.use(function(req, res, next) {
  res.status(404).send({error: 'Oops! page not found.'});
});

db().then(function() {
  var port = process.env.PORT || 8080;
  var server = app.listen(port, function() {
    console.info('server listening on http://localhost:' + server.address().port)
    server.timeout = 30000; // 30 sec
  });

  if (process.env.MASTER) {
    master.cleanGeo(60 * 60 * 1000) // 1 hour
    master.cacheFees(60 * 60 * 1000) // 1 hour
    master.cacheTicker(60 * 60 * 1000) // 1 hour
    master.cacheEthereumTokens(24 * 60 * 60 * 1000) // 24 hours
  }
}).catch(function(error) {
  console.log('error', error);
});
