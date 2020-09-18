'use strict';

const bodyParser = require('body-parser');
const compress = require('compression');
const path = require('path');
const helmet = require('helmet');
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

function init(app) {

  app.use(requireHTTPS);
  app.set('trust proxy', true);

  if (isProduction()) {
    app.use(helmet.xssFilter());
    app.use(helmet.noSniff());
    app.use(helmet.frameguard({ action: 'sameorigin' }));

    const oneYearInSeconds = 31536000;
    app.use(helmet.hsts({
      maxAge: oneYearInSeconds,
      includeSubDomains: true,
      preload: true,
    }));
  }

  app.use(cors());

  const dayInMs = 24 * 60 * 60 * 1000;
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json({
    verify(req, res, buf) {
      req.bodyHash = req.body ? crypto.createHash('sha256').update(buf).digest('hex') : '';
    },
  }));

  app.use(compress());

  const cacheControl = isProduction() ? { maxAge: dayInMs, setHeaders: setCustomCacheControl } : null;
  app.use(express.static(path.join(__dirname, '..', 'build'), cacheControl));
}

function setCustomCacheControl(res, path) {
  if (express.static.mime.lookup(path) === 'text/html') {
    res.setHeader('Cache-Control', 'public, max-age=0');
  }
}

function requireHTTPS(req, res, next) {
  const herokuForwardedFromHTTPS = req.headers['x-forwarded-proto'] === 'https';
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
  init,
};
