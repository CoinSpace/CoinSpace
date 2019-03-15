'use strict';

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var compress = require('compression');
var path = require('path');
var helmet = require('helmet');
var express = require('express');

function init(app) {

  app.use(requireHTTPS);

  if (isProduction()) {
    app.set('trust proxy', true)
    app.use(helmet.xssFilter())
    app.use(helmet.noSniff())
    app.use(helmet.frameguard({action: 'sameorigin'}))

    var hundredEightyDaysInMilliseconds = 180 * 24 * 60 * 60 * 1000
    app.use(helmet.hsts({
      maxAge: hundredEightyDaysInMilliseconds,
      includeSubDomains: true
    }))
  }

  var anHour = 1000 * 60 * 60
  app.use(bodyParser.urlencoded({extended: true}))
  app.use(bodyParser.json())
  app.use(cookieParser(process.env.COOKIE_SALT))
  app.use(cookieSession({
    signed: false,
    overwrite: false,
    maxAge: anHour,
    httpOnly: true,
    secure: isProduction()
  }))
  app.use(cookieOnion)
  app.use(compress())

  var cacheControl = isProduction() ? { maxAge: anHour } : null
  app.use(express.static(path.join(__dirname, '..', 'build'), cacheControl))
}

function cookieOnion(req, res, next) {
  if (isOnionDomain(req)) {
    req.sessionOptions.secure = false;
  }
  next();
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
  init: init
};
