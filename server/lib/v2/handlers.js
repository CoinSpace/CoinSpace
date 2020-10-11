'use strict';

const createError = require('http-errors');
const wallets = require('./wallets');
const mecto = require('./mecto');
const moonpay = require('./moonpay');
const { asyncWrapper, verifyReq } = require('./utils');

exports.register = asyncWrapper(async (req, res) => {
  await verifyReq(req.body.walletId, req);
  const info = await wallets.register(req.body.walletId, req.body.deviceId, req.body.pinHash);
  console.log('registered wallet: %s device: %s', req.body.walletId, req.body.deviceId);
  res.status(201).send(info);
});

// Public

exports.tokenPublicPinVerify = asyncWrapper(async (req, res) => {
  await wallets.pinVerify(req.device, req.body.pinHash, 'public');
  return res.status(200).send({
    publicToken: req.device.public_token,
  });
});

exports.tokenPublicPlatformOptions = asyncWrapper(async (req, res) => {
  const options = await wallets.platformOptions(req.device, 'public');
  return res.status(200).send(options);
});

exports.tokenPublicPlatformVerify = asyncWrapper(async (req, res) => {
  await wallets.platformVerify(req.device, req.body, 'public');
  return res.status(200).send({
    publicToken: req.device.public_token,
  });
});

// Private

exports.tokenPrivate = asyncWrapper(async (req, res) => {
  if (req.device.wallet.settings['1fa_private'] === false) {
    if (req.device.wallet.authenticators.length === 0) {
      return res.status(200).send({
        privateToken: req.device.private_token,
      });
    }
  }

  throw createError(401, 'Authorization required');
});

exports.tokenPrivatePinVerify = asyncWrapper(async (req, res) => {
  if (req.device.wallet.settings['1fa_private'] !== false) {
    await wallets.pinVerify(req.device, req.body.pinHash, 'private');
    if (req.device.wallet.authenticators.length === 0) {
      return res.status(200).send({
        privateToken: req.device.private_token,
      });
    } else {
      const options = await wallets.crossplatformOptions(req.device, 'private');
      return res.status(200).send(options);
    }
  }

  throw createError(400, 'Incorrect authenticator');
});

exports.tokenPrivatePlatformOptions = asyncWrapper(async (req, res) => {
  if (req.device.wallet.settings['1fa_private'] !== false) {
    const options = await wallets.platformOptions(req.device, 'private');
    return res.status(200).send(options);
  }

  throw createError(400, 'Incorrect authenticator');
});

exports.tokenPrivatePlatformVerify = asyncWrapper(async (req, res) => {
  if (req.device.wallet.settings['1fa_private'] !== false) {
    await wallets.platformVerify(req.device, req.body, 'private');
    if (req.device.wallet.authenticators.length === 0) {
      return res.status(200).send({
        privateToken: req.device.private_token,
      });
    } else {
      const options = await wallets.crossplatformOptions(req.device, 'private');
      return res.status(200).send(options);
    }
  }

  throw createError(400, 'Incorrect authenticator');
});

exports.tokenPrivateCrossplatformOptions = asyncWrapper(async (req, res) => {
  if (req.device.wallet.settings['1fa_private'] === false) {
    const options = await wallets.crossplatformOptions(req.device, 'private');
    return res.status(200).send(options);
  }

  throw createError(400, 'Incorrect authenticator');
});

exports.tokenPrivateCrossplatformVerify = asyncWrapper(async (req, res) => {
  await wallets.crossplatformVerify(req.device, req.body, 'private');
  return res.status(200).send({
    privateToken: req.device.private_token,
  });
});

// Attestation

exports.platformAttestationOptions = asyncWrapper(async (req, res) => {
  const options = await wallets.platformAttestationOptions(req.device);
  res.status(200).send(options);
});

exports.platformAttestationVerify = asyncWrapper(async (req, res) => {
  await wallets.platformAttestationVerify(req.device, req.body);
  res.status(200).send({ success: true });
});

exports.crossplatformAttestationOptions = asyncWrapper(async (req, res) => {
  const options = await wallets.crossplatformAttestationOptions(req.device);
  res.status(200).send(options);
});

exports.crossplatformAttestationVerify = asyncWrapper(async (req, res) => {
  await wallets.crossplatformAttestationVerify(req.device, req.body);
  res.status(200).send({ success: true });
});

// API

exports.removePlatformAuthenticator = asyncWrapper(async (req, res) => {
  await wallets.removePlatformAuthenticator(req.device);
  res.status(200).send({ success: true });
});

exports.listCrossplatformAuthenticators = asyncWrapper(async (req, res) => {
  const list = await wallets.listCrossplatformAuthenticators(req.device);
  res.status(200).send(list);
});

exports.removeCrossplatformAuthenticator = asyncWrapper(async (req, res) => {
  await wallets.removeCrossplatformAuthenticator(req.device, req.body.credentialID);
  res.status(200).send({ success: true });
});

exports.getSettings = asyncWrapper(async (req, res) => {
  res.status(200).send({
    '1faPrivate': req.device.wallet.settings['1fa_private'],
  });
});

exports.setSettings = asyncWrapper(async (req, res) => {
  const data = {};
  if ('1faPrivate' in req.body) {
    data['1fa_private'] = req.body['1faPrivate'];
  }
  const settings = await wallets.setSettings(req.device, data);
  res.status(200).send({
    '1faPrivate': settings['1fa_private'],
  });
});

exports.getDetails = asyncWrapper(async (req, res) => {
  res.status(200).send({
    data: req.device.wallet.details,
  });
});

exports.setDetails = asyncWrapper(async (req, res) => {
  const data = await wallets.setDetails(req.device, req.body.data);
  res.status(200).send({ data });
});

exports.setUsername = asyncWrapper(async (req, res) => {
  const username = await wallets.setUsername(req.device, req.body.username);
  res.status(200).send({ username });
});

exports.removeDevice = asyncWrapper(async (req, res) => {
  await wallets.removeDevice(req.device);
  res.status(200).send({ success: true });
});

exports.removeWallet = asyncWrapper(async (req, res) => {
  await wallets.removeWallet(req.device);
  res.status(200).send({ success: true });
});

exports.searchMecto = asyncWrapper(async (req, res) => {
  const results = await mecto.search(req.device, req.query);
  res.status(200).send(results);
});

exports.saveMecto = asyncWrapper(async (req, res) => {
  await mecto.save(req.device, req.body);
  res.status(200).send({ success: true });
});

exports.removeMecto = asyncWrapper(async (req, res) => {
  await mecto.remove(req.device);
  res.status(200).send({ success: true });
});

exports.moonpaySign = asyncWrapper(async (req, res) => {
  const urls = await moonpay.sign(req.body.urls);
  res.status(200).send({ urls });
});
