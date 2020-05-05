'use strict';

var express = require('express');

var auth = require('./auth');
var account = require('./account');
var geo = require('./geo');
var validatePin = require('cs-pin-validator');
var openalias = require('cs-openalias');
var fee = require('./fee');
var csFee = require('./csFee');
var ticker = require('./ticker');
var ethereumTokens = require('./ethereumTokens');
var shapeshift = require('./shapeshift');
var changelly = require('./changelly');
var moonpay = require('./moonpay');

var router = express.Router();

router.post('/register', validateAuthParams(false), function(req, res) {
  var walletId = req.body.wallet_id;
  auth.register(walletId, req.body.pin).then(function(token) {
    setCookie(req, walletId, function() {
      console.log('registered wallet %s', walletId);
      res.status(200).send(token);
    })
  }).catch(function(err) {
    if (!['auth_failed', 'user_deleted'].includes(err.error)) console.error('error', err);
    return res.status(400).send(err);
  });
});

router.post('/login', validateAuthParams(true), function(req, res) {
  var walletId = req.body.wallet_id;
  auth.login(walletId, req.body.pin).then(function(token) {
    setCookie(req, walletId, function() {
      console.log('authenticated wallet %s', walletId);
      res.status(200).send(token);
    });
  }).catch(function(err) {
    if (!['auth_failed', 'user_deleted'].includes(err.error)) console.error('error', err);
    res.status(400).send(err);
  });
});

router.get('/exist', function(req, res) {
  var walletId = req.query.wallet_id;
  if (!walletId) return res.status(400).json({error: 'Bad request'});
  account.isExist(walletId).then(function(userExist) {
    res.status(200).send(userExist);
  }).catch(function(err) {
    return res.status(400).send(err);
  });
});

router.get('/openalias', function(req, res) {
  var hostname = req.query.hostname
  if (!hostname) return res.status(400).json({error: 'Bad request'});
  openalias.resolve(hostname, function(err, address, name) {
    if(err) return res.status(400).send(err)
    res.status(200).send({address: address, name: name})
  })
});

router.put('/username', restrict, function(req, res) {
  var id = req.body.id;
  var username = req.body.username;
  if (!username) return res.status(400).json({error: 'Bad request'});
  account.setUsername(id, username).then(function(username) {
    res.status(200).send({username: username});
  }).catch(function(err) {
    res.status(400).send(err);
  });
});

router.get('/details', restrict, function(req, res) {
  account.getDetails(req.query.id).then(function(details) {
    res.status(200).json(details);
  }).catch(function(err) {
    res.status(400).send(err);
  });
});

router.put('/details', restrict, function(req, res) {
  if (!req.body.data) return res.status(400).json({error: 'Bad request'});
  account.saveDetails(req.body.id, req.body.data).then(function(details) {
    res.status(200).json(details);
  }).catch(function(err) {
    res.status(400).send(err);
  });
});

router.delete('/account', restrict, function(req, res) {
  var id = req.body.id;
  account.remove(id).then(function() {
    res.status(200).send()
  }).catch(function(err) {
    res.status(400).send(err);
  })
});

router.get('/fees', function(req, res) {
  var network = req.query.network || 'bitcoin'
  fee.getFromCache(network).then(function(fees) {
    delete fees._id;
    res.status(200).send(fees);
  }).catch(function(err) {
    res.status(400).send(err);
  });
});

router.get('/csFee', function(req, res) {
  var network = req.query.network || 'bitcoin'
  csFee.get(network).then(function(data) {
    res.status(200).send(data);
  }).catch(function(err) {
    res.status(400).send(err);
  });
});

router.get('/ticker', function(req, res) {
  var crypto = req.query.crypto
  if (!crypto) return res.status(400).json({error: 'Bad request'});
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

router.post('/location', restrict, function(req, res) {
  var data = req.body;
  geo.save(data.lat, data.lon, data).then(function() {
    res.status(201).send();
  }).catch(function(err) {
    res.status(400).json(err);
  });
});

router.put('/location', restrict, function(req, res) {
  var data = req.body;
  geo.search(data.lat, data.lon, data).then(function(results) {
    res.status(200).json(results);
  }).catch(function(err) {
    res.status(400).json(err);
  });
});

router.delete('/location', restrict, function(req, res) {
  geo.remove(req.body.id).catch(console.error);
  res.status(200).send();
});

router.get('/shapeShiftRedirectUri', function(req, res) {
  var code = req.query.code || '';
  var buildType = req.query.buildType;
  if (!['web', 'phonegap', 'electron'].includes(buildType)) return res.status(400).send('Bad request');
  shapeshift.getAccessToken(code).then(function(accessToken) {
    res.render('shapeshift', {accessToken: accessToken, buildType: buildType});
  }).catch(function() {
    res.render('shapeshift', {accessToken: '', buildType: buildType});
  });
});

router.delete('/shapeShiftToken', restrict, function(req, res) {
  var token = req.body.token;
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
  var from = req.query.from || '';
  var to = req.query.to || '';
  var amount = req.query.amount || 0;
  if (!from || !to) return res.status(400).json({error: 'Bad request'});
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
  })
});

router.post('/changelly/createTransaction', restrict, function(req, res) {
  var from = req.body.from;
  var to = req.body.to;
  var amount = req.body.amount;
  var address = req.body.address;
  var refundAddress = req.body.refundAddress;
  if (!from || !to || !amount || !address) return res.status(400).json({error: 'Bad request'});
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
  var id = 'coins';
  if (req.query.country === 'USA') id += '_usa';
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
  if (!['document', 'allowed'].includes(req.query.type)) return res.status(400).json({error: 'Bad request'});
  moonpay.getFromCache('countries_' + req.query.type).then(function(data) {
    res.status(200).send(data);
  }).catch(function(err) {
    res.status(400).send(err);
  });
});

router.get('/moonpay/redirectURL', function(req, res) {
  var buildType = req.query.buildType;
  var transactionId = req.query.transactionId || '';
  if (!['web', 'phonegap', 'electron'].includes(buildType)) return res.status(400).send('Bad request');
  res.render('moonpay', {transactionId: transactionId, buildType: buildType});
});

function validateAuthParams(allowMissingPin) {
  return function (req, res, next) {
    if (!req.body.wallet_id || !validatePin(req.body.pin, allowMissingPin)) {
      return res.status(400).json({error: 'Bad request'})
    }
    next();
  }
}

function restrict(req, res, next) {
  var id = req.method === 'GET' ? req.query.id : req.body.id;
  var session_id = req.session.wallet_id;
  if (session_id && session_id === id) {
    next();
  } else {
    return res.status(401).send();
  }
}

function setCookie(req, wallet_id, callback) {
  req.session.wallet_id = wallet_id;
  callback();
}

module.exports = router;
