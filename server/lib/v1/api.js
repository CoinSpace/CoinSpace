'use strict';

const express = require('express');

const auth = require('./auth');
const account = require('./account');
const geo = require('./geo');
const validatePin = require('cs-pin-validator');
const openalias = require('cs-openalias');
const fee = require('./fee');
const csFee = require('./csFee');
const ticker = require('./ticker');
const ethereumTokens = require('./ethereumTokens');
const shapeshift = require('./shapeshift');
const changelly = require('./changelly');
const moonpay = require('./moonpay');
const semver = require('semver');
const github = require('./github');

const router = express.Router();

router.post('/register', validateAuthParams, function(req, res) {
  const walletId = req.body.wallet_id;
  auth.register(walletId, req.body.pin).then(function(token) {
    console.log('registered wallet %s', walletId);
    res.status(200).send(token);
  }).catch(function(err) {
    if (!['auth_failed', 'user_deleted'].includes(err.error)) console.error('error', err);
    return res.status(400).send(err);
  });
});

router.post('/login', validateAuthParams, function(req, res) {
  const walletId = req.body.wallet_id;
  auth.login(walletId, req.body.pin).then(function(token) {
    console.log('authenticated wallet %s', walletId);
    res.status(200).send(token);
  }).catch(function(err) {
    if (!['auth_failed', 'user_deleted'].includes(err.error)) console.error('error', err);
    res.status(400).send(err);
  });
});

router.get('/exist', function(req, res) {
  const walletId = req.query.wallet_id;
  if (!walletId) return res.status(400).json({ error: 'Bad request' });
  account.isExist(walletId).then(function(userExist) {
    res.status(200).send(userExist);
  }).catch(function(err) {
    return res.status(400).send(err);
  });
});

router.get('/openalias', function(req, res) {
  const hostname = req.query.hostname;
  if (!hostname) return res.status(400).json({ error: 'Bad request' });
  openalias.resolve(hostname, function(err, address, name) {
    if (err) return res.status(400).send(err);
    res.status(200).send({ address, name });
  });
});

router.put('/username', function(req, res) {
  const id = req.body.id;
  const username = req.body.username;
  if (!username) return res.status(400).json({ error: 'Bad request' });
  account.setUsername(id, username).then(function(username) {
    res.status(200).send({ username });
  }).catch(function(err) {
    res.status(400).send(err);
  });
});

router.get('/details', function(req, res) {
  account.getDetails(req.query.id).then(function(details) {
    res.status(200).json(details);
  }).catch(function(err) {
    res.status(400).send(err);
  });
});

router.put('/details', function(req, res) {
  if (!req.body.data) return res.status(400).json({ error: 'Bad request' });
  account.saveDetails(req.body.id, req.body.data).then(function(details) {
    res.status(200).json(details);
  }).catch(function(err) {
    res.status(400).send(err);
  });
});

router.delete('/account', function(req, res) {
  const id = req.body.id;
  account.remove(id).then(function() {
    res.status(200).send();
  }).catch(function(err) {
    res.status(400).send(err);
  });
});

router.get('/fees', function(req, res) {
  const network = req.query.network || 'bitcoin';
  fee.getFromCache(network).then(function(fees) {
    delete fees._id;
    res.status(200).send(fees);
  }).catch(function(err) {
    res.status(400).send(err);
  });
});

router.get('/csFee', function(req, res) {
  const network = req.query.network || 'bitcoin';
  csFee.get(network).then(function(data) {
    res.status(200).send(data);
  }).catch(function(err) {
    res.status(400).send(err);
  });
});

router.get('/ticker', function(req, res) {
  const crypto = req.query.crypto;
  if (!crypto) return res.status(400).json({ error: 'Bad request' });
  ticker.getFromCache(crypto).then(function(data) {
    res.status(200).send(data);
  }).catch(function(err) {
    res.status(400).send(err);
  });
});

router.get('/ticker/applewatch', function(req, res) {
  ticker.getFromCacheForAppleWatch().then(function(data) {
    res.status(200).send(data);
  }).catch(function(err) {
    res.status(400).send(err);
  });
});

router.get('/ethereum/tokens', function(req, res) {
  ethereumTokens.getAllFromCache().then(function(data) {
    res.status(200).send(data);
  }).catch(function(err) {
    res.status(400).send(err);
  });
});

router.post('/location', function(req, res) {
  const data = req.body;
  geo.save(data.lat, data.lon, data).then(function() {
    res.status(201).send();
  }).catch(function(err) {
    res.status(400).json(err);
  });
});

router.put('/location', function(req, res) {
  const data = req.body;
  geo.search(data.lat, data.lon, data).then(function(results) {
    res.status(200).json(results);
  }).catch(function(err) {
    res.status(400).json(err);
  });
});

router.delete('/location', function(req, res) {
  geo.remove(req.body.id).catch(console.error);
  res.status(200).send();
});

router.get('/shapeShiftRedirectUri', function(req, res) {
  const code = req.query.code || '';
  const buildType = req.query.buildType;
  if (!['web', 'phonegap', 'electron'].includes(buildType)) return res.status(400).send('Bad request');
  shapeshift.getAccessToken(code).then(function(accessToken) {
    res.render('shapeshift', { accessToken, buildType });
  }).catch(function() {
    res.render('shapeshift', { accessToken: '', buildType });
  });
});

router.delete('/shapeShiftToken', function(req, res) {
  const token = req.body.token;
  shapeshift.revokeToken(token).catch(function() {});
  res.status(200).send();
});

router.get('/changelly/getCoins', function(req, res) {
  changelly.getCoins().then(function(coins) {
    res.status(200).send(coins);
  }).catch(function(err) {
    res.status(400).send(err);
  });
});

router.get('/changelly/estimate', function(req, res) {
  const from = req.query.from || '';
  const to = req.query.to || '';
  const amount = req.query.amount || 0;
  if (!from || !to) return res.status(400).json({ error: 'Bad request' });
  changelly.estimate(from, to, amount).then(function(data) {
    res.status(200).send(data);
  }).catch(function(err) {
    res.status(400).send(err);
  });
});

router.get('/changelly/validate/:address/:symbol', function(req, res) {
  changelly.validateAddress(req.params.address, req.params.symbol).then(function(data) {
    res.status(200).send(data);
  }).catch(function(err) {
    res.status(400).send(err);
  });
});

router.post('/changelly/createTransaction', function(req, res) {
  const from = req.body.from;
  const to = req.body.to;
  const amount = req.body.amount;
  const address = req.body.address;
  const refundAddress = req.body.refundAddress;
  if (!from || !to || !amount || !address) return res.status(400).json({ error: 'Bad request' });
  changelly.createTransaction(from, to, amount, address, refundAddress).then(function(data) {
    res.status(200).send(data);
  }).catch(function(err) {
    res.status(400).send(err);
  });
});

router.get('/changelly/transaction/:id', function(req, res) {
  changelly.getTransaction(req.params.id).then(function(data) {
    res.status(200).send(data);
  }).catch(function(err) {
    res.status(400).send(err);
  });
});

router.get('/moonpay/coins', function(req, res) {
  let id = 'coins';
  if (req.query.country === 'USA') {
    id += '_usa';
  }
  moonpay.getFromCache(id).then(function(data) {
    res.status(200).send(data);
  }).catch(function(err) {
    res.status(400).send(err);
  });
});

router.get('/moonpay/fiat', function(req, res) {
  moonpay.getFromCache('fiat').then(function(data) {
    res.status(200).send(data);
  }).catch(function(err) {
    res.status(400).send(err);
  });
});

router.get('/moonpay/countries', function(req, res) {
  if (!['document', 'allowed'].includes(req.query.type)) return res.status(400).json({ error: 'Bad request' });
  moonpay.getFromCache('countries_' + req.query.type).then(function(data) {
    res.status(200).send(data);
  }).catch(function(err) {
    res.status(400).send(err);
  });
});

router.get('/moonpay/redirectURL', function(req, res) {
  const buildType = req.query.buildType;
  const transactionId = req.query.transactionId || '';
  if (!['web', 'phonegap', 'electron'].includes(buildType)) return res.status(400).send('Bad request');
  res.render('moonpay', { transactionId, buildType });
});

// for debug
// returns all releases
router.get('/updates', (req, res, next) => {
  github.getUpdates()
    .then((updates) => {
      return updates.map((item) => {
        return {
          name: item.name,
          version: item.version,
          url: item.url,
          distribution: item.distribution,
          arch: item.arch,
          app: item.app,
        };
      });
    })
    .then((updates) => {
      res.status(200).send(updates);
    })
    .catch(next);
});

router.get('/update/:distribution/:arch/:version', (req, res, next) => {
  const app = req.get('User-Agent').includes('CoinSpace') ? 'electron' : 'app';
  const { distribution, arch, version } = req.params;
  if (!semver.valid(version)) {
    return res.status(400).send({ error: `Invalid SemVer: "${version}"` });
  }
  github.getUpdate(distribution, arch, app)
    .then(update => {
      if (!update) {
        res.status(404).send({ error: 'Unsupported platform' });
      } else if (semver.eq(update.version, version)) {
        // send "no content" if version exactly match
        // this allows to downgrade version
        res.status(204).end();
      } else {
        res.status(200).send({
          name: update.name,
          version: update.version,
          url: update.url,
        });
      }
    }).catch(next);
});

router.get('/update/win/x64/:version/RELEASES', (req, res, next) => {
  const { version } = req.params;
  if (!semver.valid(version)) {
    return res.status(400).send(`Invalid SemVer: "${version}"`);
  }
  github.getUpdate('win', 'x64', 'electron')
    .then(update => {
      if (!update) {
        res.status(404).send('Unsupported platform');
      } else {
        res.status(200).send(update.content);
      }
    }).catch(next);
});

router.get('/download/:distribution/:arch', (req, res, next) => {
  const { distribution, arch } = req.params;
  github.getUpdate(distribution, arch, 'app')
    .then(update => {
      if (!update) {
        res.redirect(302, `https://github.com/${github.account}/releases/latest`);
      } else {
        res.redirect(302, update.url);
      }
    }).catch(next);
});

function validateAuthParams(req, res, next) {
  if (!req.body.wallet_id || !validatePin(req.body.pin)) {
    return res.status(400).json({ error: 'Bad request' });
  }
  next();
}

module.exports = router;
