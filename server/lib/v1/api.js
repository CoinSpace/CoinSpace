'use strict';

const express = require('express');

const auth = require('./auth');
const account = require('./account');
const geo = require('./geo');
const openalias = require('./openalias');
const fee = require('../fee');
const csFee = require('./csFee');
const tokens = require('../tokens');
const shapeshift = require('./shapeshift');
const changelly = require('./changelly');
const moonpay = require('./moonpay');
const semver = require('semver');
const github = require('./github');

const router = express.Router();

router.post('/register', validateAuthParams, (req, res) => {
  const walletId = req.body.wallet_id;
  auth.register(walletId, req.body.pin).then((token) => {
    console.log('registered wallet %s', walletId);
    res.status(200).send(token);
  }).catch((err) => {
    if (!['auth_failed', 'user_deleted'].includes(err.error)) console.error('error', err);
    return res.status(400).send(err);
  });
});

router.post('/login', validateAuthParams, (req, res) => {
  const walletId = req.body.wallet_id;
  auth.login(walletId, req.body.pin).then((token) => {
    console.log('authenticated wallet %s', walletId);
    res.status(200).send(token);
  }).catch((err) => {
    if (!['auth_failed', 'user_deleted'].includes(err.error)) console.error('error', err);
    res.status(400).send(err);
  });
});

router.get('/exist', (req, res) => {
  const walletId = req.query.wallet_id;
  if (!walletId) return res.status(400).json({ error: 'Bad request' });
  account.isExist(walletId).then((userExist) => {
    res.status(200).send(userExist);
  }).catch((err) => {
    return res.status(400).send(err);
  });
});

router.get('/openalias', (req, res) => {
  const { hostname } = req.query;
  if (!hostname) return res.status(400).json({ error: 'Bad request' });
  openalias.resolve(hostname, (err, address, name) => {
    if (err) return res.status(400).send(err);
    res.status(200).send({ address, name });
  });
});

router.put('/username', (req, res) => {
  const { id } = req.body;
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Bad request' });
  account.setUsername(id, username).then((username) => {
    res.status(200).send({ username });
  }).catch((err) => {
    res.status(400).send(err);
  });
});

router.get('/details', (req, res) => {
  account.getDetails(req.query.id).then((details) => {
    res.status(200).json(details);
  }).catch((err) => {
    res.status(400).send(err);
  });
});

router.put('/details', (req, res) => {
  if (!req.body.data) return res.status(400).json({ error: 'Bad request' });
  account.saveDetails(req.body.id, req.body.data).then((details) => {
    res.status(200).json(details);
  }).catch((err) => {
    res.status(400).send(err);
  });
});

router.delete('/account', (req, res) => {
  const { id } = req.body;
  account.remove(id).then(() => {
    res.status(200).send();
  }).catch((err) => {
    res.status(400).send(err);
  });
});

router.get('/fees', (req, res) => {
  const network = req.query.network || 'bitcoin';
  fee.getFees(network).then((fees) => {
    res.status(200).send(fees);
  }).catch((err) => {
    res.status(400).send(err);
  });
});

router.get('/csFee', (req, res) => {
  const network = req.query.network || 'bitcoin';
  csFee.get(network).then((data) => {
    res.status(200).send(data);
  }).catch((err) => {
    res.status(400).send(err);
  });
});

router.get('/ticker', (req, res) => {
  const { crypto } = req.query;
  if (!crypto) return res.status(400).json({ error: 'Bad request' });
  tokens.getPriceBySymbol(crypto).then((data) => {
    res.status(200).send(data);
  }).catch((err) => {
    res.status(400).send(err);
  });
});

router.get('/ticker/applewatch', (req, res) => {
  tokens.getFromCacheForAppleWatch().then((data) => {
    res.status(200).send(data);
  }).catch((err) => {
    res.status(400).send(err);
  });
});

router.get('/ethereum/tokens', (req, res) => {
  tokens.getTokens('ethereum', 50).then((data) => {
    res.status(200).send(data);
  }).catch((err) => {
    res.status(400).send(err);
  });
});

router.post('/location', (req, res) => {
  const data = req.body;
  geo.save(data.lat, data.lon, data).then(() => {
    res.status(201).send();
  }).catch((err) => {
    res.status(400).json(err);
  });
});

router.put('/location', (req, res) => {
  const data = req.body;
  geo.search(data.lat, data.lon, data).then((results) => {
    res.status(200).json(results);
  }).catch((err) => {
    res.status(400).json(err);
  });
});

router.delete('/location', (req, res) => {
  geo.remove(req.body.id).catch(console.error);
  res.status(200).send();
});

router.delete('/shapeShiftToken', (req, res) => {
  const { token } = req.body;
  shapeshift.revokeToken(token).catch(() => {});
  res.status(200).send();
});

router.get('/changelly/getCoins', (req, res) => {
  changelly.getCoins().then((coins) => {
    res.status(200).send(coins);
  }).catch((err) => {
    res.status(400).send({ error: err.message });
  });
});

// deprecated since v3.0.8
router.get('/changelly/getMinAmount', (req, res) => {
  const from = req.query.from || '';
  const to = req.query.to || '';
  if (!from || !to) return res.status(400).json({ error: 'Bad request' });
  changelly.getMinAmount(from, to).then((data) => {
    res.status(200).send(data);
  }).catch((err) => {
    res.status(400).send({ error: err.message });
  });
});

router.get('/changelly/getPairsParams', (req, res) => {
  const from = req.query.from || '';
  const to = req.query.to || '';
  if (!from || !to) return res.status(400).json({ error: 'Bad request' });
  changelly.getPairsParams(from, to).then((data) => {
    res.status(200).send(data);
  }).catch((err) => {
    res.status(400).send({ error: err.message });
  });
});

router.get('/changelly/estimate', (req, res) => {
  const from = req.query.from || '';
  const to = req.query.to || '';
  const amount = req.query.amount || 0;
  if (!from || !to) return res.status(400).json({ error: 'Bad request' });
  changelly.estimate(from, to, amount).then((data) => {
    res.status(200).send(data);
  }).catch((err) => {
    res.status(400).send({ error: err.message });
  });
});

router.get('/changelly/validate/:address/:symbol', (req, res) => {
  changelly.validateAddress(req.params.address, req.params.symbol).then((data) => {
    res.status(200).send(data);
  }).catch((err) => {
    res.status(400).send({ error: err.message });
  });
});

router.post('/changelly/createTransaction', (req, res) => {
  const { from } = req.body;
  const { to } = req.body;
  const { amount } = req.body;
  const { address } = req.body;
  const { refundAddress } = req.body;
  if (!from || !to || !amount || !address) return res.status(400).json({ error: 'Bad request' });
  changelly.createTransaction(from, to, amount, address, refundAddress).then((data) => {
    res.status(200).send(data);
  }).catch((err) => {
    res.status(400).send({ error: err.message });
  });
});

router.get('/changelly/transaction/:id', (req, res) => {
  changelly.getTransaction(req.params.id).then((data) => {
    res.status(200).send(data);
  }).catch((err) => {
    res.status(400).send({ error: err.message });
  });
});

router.get('/moonpay/coins', (req, res) => {
  let id = 'coins';
  if (req.query.country === 'USA') {
    id += '_usa';
  }
  moonpay.getFromCache(id).then((data) => {
    res.status(200).send(data);
  }).catch((err) => {
    res.status(400).send(err);
  });
});

router.get('/moonpay/fiat', (req, res) => {
  moonpay.getFromCache('fiat').then((data) => {
    res.status(200).send(data);
  }).catch((err) => {
    res.status(400).send(err);
  });
});

router.get('/moonpay/countries', (req, res) => {
  if (!['document', 'allowed'].includes(req.query.type)) return res.status(400).json({ error: 'Bad request' });
  moonpay.getFromCache('countries_' + req.query.type).then((data) => {
    res.status(200).send(data);
  }).catch((err) => {
    res.status(400).send(err);
  });
});

router.get('/moonpay/redirectURL', (req, res) => {
  const { buildType } = req.query;
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
      } else if (semver.gt(update.version, version)) {
        res.status(200).send({
          name: update.name,
          version: update.version,
          url: update.url,
        });
      } else {
        // send "no content" if version is equal or less
        res.status(204).end();
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

function validatePin(pin) {
  return pin != undefined && pin.match(/^\d{4}$/);
}

module.exports = router;
