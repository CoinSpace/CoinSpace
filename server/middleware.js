'use strict';

var bodyParser = require('body-parser');
var compress = require('compression');
var path = require('path');
var helmet = require('helmet');
var express = require('express');
var cors = require('cors');

function init(app) {

  app.use(requireHTTPS);

  if (isProduction()) {
    app.set('trust proxy', true);
    app.use(helmet.xssFilter());
    app.use(helmet.noSniff());
    app.use(helmet.frameguard({action: 'sameorigin'}));

    var oneYearInSeconds = 31536000;
    app.use(helmet.hsts({
      maxAge: oneYearInSeconds,
      includeSubDomains: true,
      preload: true,
    }));
  }

  app.use(cors());

  var dayInMs = 24 * 60 * 60 * 1000;
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(bodyParser.json());

  app.use(compress());

  var cacheControl = isProduction() ? { maxAge: dayInMs, setHeaders: setCustomCacheControl } : null;
  app.use(express.static(path.join(__dirname, '..', 'build'), cacheControl));
}

function setCustomCacheControl(res, path) {
  if (express.static.mime.lookup(path) === 'text/html') {
    res.setHeader('Cache-Control', 'public, max-age=0');
  }
}

function requireHTTPS(req, res, next) {
  var herokuForwardedFromHTTPS = req.headers['x-forwarded-proto'] === 'https';
  if (!herokuForwardedFromHTTPS && !isOnionDomain(req) && isProduction()) {
    return res.redirect('https://' + req.get('host') + req.url);
  }
  next();
}

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function isOnionDomain(req) {
  return req.hostname === process.env.DOMAIN_ONION;
}

module.exports = {
  init: init,
};
