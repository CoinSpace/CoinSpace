'use strict';

var express = require('express');
var middleware = require('./middleware');

var api = require('./lib/v1/api');
var app = express();

var master = require('./lib/v1/master');
var db = require('./lib/v1/db');

middleware.init(app);

// API routes
app.use('/api/v1', api);
app.set('views', './server/views');
app.set('view engine', 'ejs');

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

  if (process.env.MASTER === '1') {
    master.cleanGeo(60 * 60 * 1000) // 1 hour
    master.cacheFees(60 * 60 * 1000) // 1 hour
    master.cacheTicker(1 * 60 * 1000) // 1 minute
    master.cacheEthereumTokens(1 * 60 * 1000) // 1 minute
    master.cacheMoonpayCurrencies(60 * 60 * 1000) // 1 hour
    master.cacheMoonpayCountries(60 * 60 * 1000) // 1 hour
  }
}).catch(function(error) {
  console.log('error', error);
});
