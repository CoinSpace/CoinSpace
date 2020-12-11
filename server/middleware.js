'use strict';

const bodyParser = require('body-parser');
const compress = require('compression');
const path = require('path');
const helmet = require('helmet');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const querystring = require('querystring');
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

  app.use('/api/', (req, res, next) => {
    next();
    const id = req.query.id || req.body.deviceId || req.body.wallet_id;
    if (!id) return;
    const [, app, store, version] = req.get('X-Release') !== undefined ?
      req.get('X-Release').match(/(.+)\.(.+)@(.+)/i) : [];
    axios({
      url: 'https://www.google-analytics.com/collect',
      method: 'post',
      data: querystring.stringify({
        v: 1, t: 'screenview',
        tid: process.env.ANALYTICS_ID,
        aip: 1, uid: id,
        dl: req.path, dt: req.path, cd: req.path,
        uip: req.ip, ua: req.get('User-Agent'),
        an: app, av: version, aiid: store,
      }),
    }).catch(() => {});
  });

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
