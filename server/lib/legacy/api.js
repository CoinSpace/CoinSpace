'use strict';

var express = require('express');

var auth = require('./auth');
var validatePin = require('cs-pin-validator');
var crypto = require('crypto');
var openalias = require('cs-openalias');

var geo = require('../v1/geo');
var fee = require('../v1/fee');
var ticker = require('../v1/ticker');

var router = express.Router();

router.post('/register', validateAuthParams(false), function(req, res) {
  var name = req.body.wallet_id
  auth.register(name, req.body.pin, function(err, token){
    if(err) {
      console.error('error', err)
      return res.status(400).send(err)
    }

    setCookie(req, name, function(){
      console.log('registered wallet %s', name)
      res.status(200).send(token)
    })
  })
})

router.post('/login', validateAuthParams(true), function(req, res) {
  var name = req.body.wallet_id
  auth.login(name, req.body.pin, function(err, token){
    if(err) {
      console.error('error', err)
      return res.status(400).send(err)
    }

    setCookie(req, name, function(){
      console.log('authenticated wallet %s', name)
      res.status(200).send(token)
    })
  })
})

router.get('/exist', function(req, res){
  var name = req.query.wallet_id
  if (!name) return res.status(400).json({error: 'Bad request'});

  auth.exist(name, function(err, userExist){
    if(err) {
      console.error('error', err)
      return res.status(400).send(err)
    }

    res.status(200).send(userExist)
  })
})

router.get('/openalias', function(req, res) {
  var hostname = req.query.hostname
  if (!hostname) return res.status(400).json({error: 'Bad request'});
  openalias.resolve(hostname, function(err, address, name) {
    if(err) return res.status(400).send(err)
    res.status(200).send({address: address, name: name})
  })
})

router.post('/username', restrict, function(req, res) {
  var id = req.body.id
  var username = req.body.username
  if (!username) return res.status(400).json({error: 'Bad request'});

  auth.setUsername(id, username, function(err, username) {
    if(err) return res.status(400).send(err)
    res.status(200).send({username: username})
  })
})

router.delete('/account', restrict, function(req, res) {
  var id = req.body.id
  auth.remove(id, function(err){
    if (err) return res.status(400).send(err);
    res.status(200).send()
  })
})

router.get('/fees', function(req, res) {
  var network = req.query.network || 'bitcoin'
  fee.getFromCache(network).then(function(fees) {
    delete fees._id;
    res.status(200).send(fees);
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

router.post('/location', function(req, res) {
  var args = prepareGeoData(req)
  geo.save(args.lat, args.lon, args.data).then(function() {
    res.status(201).send();
  }).catch(function(err) {
    res.status(400).json(err);
  });
});

router.put('/location', function(req, res) {
  var args = prepareGeoData(req)
  geo.search(args.lat, args.lon, args.data).then(function(results) {
    res.status(200).json(results);
  }).catch(function(err) {
    res.status(400).json(err);
  });
});

function prepareGeoData(req) {
  var data = req.body

  var lat = data.lat
  var lon = data.lon
  delete data.lat
  delete data.lon

  var id = req.session.tmpSessionID
  if(!id) {
    id = crypto.randomBytes(16).toString('base64')
    req.session.tmpSessionID = id
  }
  data.id = id

  return {lat: lat, lon: lon, data: data}
}

router.delete('/location', function(req, res) {
  geo.remove(req.session.tmpSessionID).catch(console.error);
  res.status(200).send();
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
  var session_id = req.session.wallet_id;
  if (session_id && session_id === req.body.id) {
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
