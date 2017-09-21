"use strict"

var express = require('express')
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var cookieSession = require('cookie-session')
var compress = require('compression')
var path = require('path')
var auth = require('./auth')
var geo = require('./geo')
var validatePin = require('cs-pin-validator')
var crypto = require('crypto')
var helmet = require('helmet')
var csp = require('helmet-csp')
var openalias = require('cs-openalias')
var fee = require('./fee')
var ticker = require('./ticker')

module.exports = function (){
  var app = express()

  app.use(requireHTTPS)

  if(isProduction()){
    app.set('trust proxy', true)
    var connectSrc = [
      "'self'", 'blob:',
      'apiv2.bitcoinaverage.com', // ticker
      'btc.blockr.io', 'tbtc.blockr.io', 'ltc.blockr.io', 'insight.bitpay.com',
      'live.coin.space', 'btc.coin.space', 'ltc.coin.space',
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

  var anHour = 1000*60*60
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

  app.post('/register', validateAuthParams(false), function(req, res) {
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

  app.post('/login', validateAuthParams(true), function(req, res) {
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

  app.get('/exist', function(req, res){
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

  app.get('/openalias', function(req, res) {
    var hostname = req.query.hostname
    if (!hostname) return res.status(400).json({error: 'Bad request'});
    openalias.resolve(hostname, function(err, address, name) {
      if(err) return res.status(400).send(err)
      res.status(200).send({address: address, name: name})
    })
  })

  app.post('/username', restrict, function(req, res) {
    var id = req.body.id
    var username = req.body.username
    if (!username) return res.status(400).json({error: 'Bad request'});

    auth.setUsername(id, username, function(err, username) {
      if(err) return res.status(400).send(err)
      res.status(200).send({username: username})
    })
  })

  app.delete('/pin', restrict, function(req, res) {
    var id = req.body.id
    var pin = req.body.pin

    auth.disablePin(id, pin, function(err){
      if(err) return res.status(400).send(err)
      res.status(200).send()
    })
  })

  app.get('/fees', function(req, res) {
    fee.getFromCache(function(err, doc) {
      if(err) return res.status(400).send(err);
      res.status(200).send({hour: doc.hour, fastest: doc.fastest})
    })
  })

  app.get('/ticker', function(req, res) {
    var crypto = req.query.crypto
    if (!crypto) return res.status(400).json({error: 'Bad request'});

    ticker.getFromCache(crypto, function(err, data) {
      if(err) return res.status(400).send(err);
      res.status(200).send(data)
    })
  })

  app.post('/location', function(req, res) {
    var args = prepareGeoData(req, res)

    args.push(function(err) {
      if(err) return res.status(400).json(err);
      res.status(201).send()
    })

    geo.save.apply(null, args)
  })

  app.put('/location', function(req, res) {
    var args = prepareGeoData(req, res)
    args.push(function(err, results) {
      if(err) return res.status(400).json(err)
      res.status(200).json(results)
    })

    geo.search.apply(null, args)
  })

  function prepareGeoData(req, res){
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

    return [lat, lon, data]
  }

  app.delete('/location', function(req, res) {
    geo.getById(req.session.tmpSessionID, function(err, doc) {
      if (doc) geo.remove(doc);
      res.status(200).send();
    });
  })

  app.use(function(err, req, res, next){
    console.error(err.stack);
    res.status(500).send('Oops! something went wrong.');
  })

  app.use(function(req, res, next) {
    res.status(404).send('Oops! page not found.');
  })

  function validateAuthParams(allowMissingPin) {
    return function (req, res, next) {
      if (!req.body.wallet_id || !validatePin(req.body.pin, allowMissingPin)) {
        return res.status(400).json({error: 'Bad request'})
      }

      next()
    }
  }

  function restrict(req, res, next) {
    var session_id = req.session.wallet_id
    if (session_id && session_id === req.body.id) {
      next()
    } else {
      return res.status(401).send()
    }
  }

  function setCookie(req, wallet_id, callback){
    req.session.wallet_id = wallet_id
    callback()
  }

  function requireHTTPS(req, res, next) {
    var herokuForwardedFromHTTPS = req.headers['x-forwarded-proto'] === 'https'
    if (!herokuForwardedFromHTTPS && isProduction()) {
      return res.redirect('https://' + req.get('host') + req.url)
    }
    next()
  }

  function isProduction(){
    return process.env.NODE_ENV === 'production'
  }
  return app
}

