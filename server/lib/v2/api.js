'use strict';

const path = require('path');
const express = require('express');
const createError = require('http-errors');
const jose = require('jose');
const { OpenApiValidator } = require('express-openapi-validator');
const device = require('./device');
const { asyncWrapper } = require('./utils');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const JWE_SECRET = process.env.JWE_SECRET;

function getJWT(id, audience, expiresIn) {
  return jose.JWE.encrypt(jose.JWT.sign({
    id,
  }, JWT_SECRET, {
    audience,
    expiresIn,
  }), JWE_SECRET);
}

function authenticate(audience) {
  // req, scopes, schema
  return (req) => {
    const token = req.headers.authorization.replace(/Bearer\s+/i, '');
    const data = jose.JWT.verify(jose.JWE.decrypt(token, JWE_SECRET).toString(), JWT_SECRET);

    if (data.aud === audience) {
      req.deviceId = data.id;
      return true;
    }
    throw createError(403, 'Invalid audience');
  };
}

new OpenApiValidator({
  apiSpec: path.join(__dirname, 'api.yaml'),
  // Validate responses only in dev environment
  validateResponses: process.NODE_ENV !== 'production',
  validateSecurity: {
    handlers: {
      loginAuth: authenticate('login'),
      walletAuth: authenticate('wallet'),
      secondAuth: authenticate('second'),
    },
  },
})
  .install(router)
  .then(() => {

    router.post('/register', asyncWrapper(async (req, res) => {
      const info = await device.register(req.body.wallet, req.body.pin);
      console.log('registered wallet %s', info.id);
      const login = getJWT(info.id, 'login');
      const jwt = getJWT(info.id, 'wallet', '5 min');
      res.status(201).send({
        login,
        jwt,
        token: info.token,
      });
    }));

    router.post('/login', asyncWrapper(async (req, res) => {
      const info = await device.login(req.deviceId, req.body.pin);

      if (info.second === true) {
        console.log('authenticated first factor wallet %s', info.id);
        const jwt = getJWT(info.id, 'second', '5 min');
        res.status(200).send({
          second: true,
          jwt,
        });
      } else {
        console.log('authenticated wallet %s', info.id);
        const jwt = getJWT(info.id, 'wallet', '5 min');
        res.status(200).send({
          jwt,
        });
      }
    }));

    router.get('/token', asyncWrapper(async (req, res) => {
      const info = await device.token(req.deviceId);
      console.log('got token wallet %s', info.id);
      const jwt = getJWT(info.id, 'wallet', '5 min');
      res.status(200).send({
        token: info.token,
        jwt,
      });
    }));

    router.get('/details', asyncWrapper(async (req, res) => {
      const data = await device.getDetails(req.deviceId);
      const jwt = getJWT(req.deviceId, 'wallet', '5 min');
      res.status(200).send({
        data,
        jwt,
      });
    }));

    router.put('/details', asyncWrapper(async (req, res) => {
      const data = await device.setDetails(req.deviceId, req.body.data);
      const jwt = getJWT(req.deviceId, 'wallet', '5 min');
      res.status(200).send({
        data,
        jwt,
      });
    }));

    router.put('/username', asyncWrapper(async (req, res) => {
      const username = await device.setUsername(req.deviceId, req.body.username);
      const jwt = getJWT(req.deviceId, 'wallet', '5 min');
      res.status(200).send({
        username,
        jwt,
      });
    }));

    router.delete('/account', asyncWrapper(async (req, res) => {
      const success = await device.remove(req.deviceId);
      res.status(200).send({
        success,
      });
    }));

    router.get('/first/attestation', asyncWrapper(async (req, res) => {
      const options = await device.firstAttestationOptions(req.deviceId);
      res.status(200).send(options);
    }));

    router.post('/first/attestation', asyncWrapper(async (req, res) => {
      const info = await device.firstAttestationVerify(req.deviceId, req.body);
      res.status(200).send(info);
    }));

    router.get('/first/assertion', asyncWrapper(async (req, res) => {
      const options = await device.firstAssertionOptions(req.deviceId);
      res.status(200).send(options);
    }));

    router.post('/first/assertion', asyncWrapper(async (req, res) => {
      const info = await device.firstAssertionVerify(req.deviceId, req.body);

      if (info.second === true) {
        const jwt = getJWT(info.id, 'second', '5 min');
        res.status(200).send({
          second: true,
          jwt,
        });
      } else {
        const jwt = getJWT(info.id, 'wallet', '5 min');
        res.status(200).send({
          jwt,
        });
      }
    }));

    router.get('/second/attestation', asyncWrapper(async (req, res) => {
      const options = await device.secondAttestationOptions(req.deviceId);
      res.status(200).send(options);
    }));

    router.post('/second/attestation', asyncWrapper(async (req, res) => {
      const info = await device.secondAttestationVerify(req.deviceId, req.body);
      res.status(200).send(info);
    }));

    router.get('/second/assertion', asyncWrapper(async (req, res) => {
      const options = await device.secondAssertionOptions(req.deviceId);
      res.status(200).send(options);
    }));

    router.post('/second/assertion', asyncWrapper(async (req, res) => {
      const info = await device.secondAssertionVerify(req.deviceId, req.body);
      const jwt = getJWT(info.id, 'wallet', '5 min');
      res.status(200).send({
        jwt,
      });
    }));

  });

module.exports = router;
