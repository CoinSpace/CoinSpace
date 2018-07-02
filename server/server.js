'use strict';

var express = require('express');
var middleware = require('./middleware');

var cors = require('cors');

var api = require('./lib/v1/api');
var app = express();

app.use(cors());
app.options('*', cors());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', function(req, res, next) {
  // Handle the get for this route
});

app.post('/', function(req, res, next) {
 // Handle the post for this route
});

var master = require('./lib/v1/master');
var db = require('./lib/v1/db');

middleware.init(app);

app.use(function (req, res, next) {
  console.info('===');
  next();
})

// API routes
app.use('/api', api);

app.use(function (req, res, next) {
  console.info('done');
  next();
})

app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send({error: 'Oops! something went wrong.'});
});

app.use(function(req, res, next) {
  res.status(404).send({error: 'Oops! page not found. :C'});
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
    master.cacheTicker(1 * 60 * 1000) // 1 minute
    master.cacheEthereumTokens(1 * 60 * 1000) // 1 minute
  }
}).catch(function(error) {
  console.log('error', error);
});
