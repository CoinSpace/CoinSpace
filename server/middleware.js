'use strict';

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var compress = require('compression');
var path = require('path');
var helmet = require('helmet');
var csp = require('helmet-csp');
var express = require('express');

function init(app) {

  app.use(requireHTTPS);

  if (isProduction()) {
    app.set('trust proxy', true)
    var connectSrc = [
      "'self'", 'blob:',
      'apiv2.bitcoinaverage.com', // ticker
      'shapeshift.io',
      'btc.blockr.io', 'tbtc.blockr.io', 'ltc.blockr.io', 'insight.bitpay.com',
      'live.coin.space', 'btc.coin.space', 'bch.coin.space', 'ltc.coin.space',
      'eth.coin.space', 'dev.eth.coin.space',
      'proxy.coin.space', // proxy
      process.env.DB_HOST
    ]

    app.use(csp({
      directives: {
        'default-src': ["'self'", 'blob:'],
        'connect-src': connectSrc,
        'font-src': ["'self'", 'coin.space'],
        'img-src': ["'self'", 'data:', 'www.gravatar.com'],
        'style-src': ["'self'", "'unsafe-inline'"],
        'script-src': ["'self'", 'blob:', "'unsafe-eval'", "'unsafe-inline'"],
      },
      reportOnly: false,
      setAllHeaders: false
    }))
    app.use(helmet.xssFilter())
    app.use(helmet.noSniff())
    app.use(helmet.frameguard({action: 'sameorigin'}))

    var hundredEightyDaysInMilliseconds = 180 * 24 * 60 * 60 * 1000
    app.use(helmet.hsts({
      maxAge: hundredEightyDaysInMilliseconds,
      includeSubdomains: true
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
  app.use(compress())

  var cacheControl = isProduction() ? { maxAge: anHour } : null
  app.use(express.static(path.join(__dirname, '..', 'build'), cacheControl))
}

function requireHTTPS(req, res, next) {
  var herokuForwardedFromHTTPS = req.headers['x-forwarded-proto'] === 'https';
  if (!herokuForwardedFromHTTPS && isProduction()) {
    return res.redirect('https://' + req.get('host') + req.url);
  }
  next();
}

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

module.exports = {
  init: init
};
