import createError from 'http-errors';
import wallets from '../wallets.js';
import storage from '../storage.js';
import mecto from '../mecto.js';
import moonpay from './moonpay.js';
import tokens from '../tokens.js';
import fee from '../fee.js';
import csFee from '../csFee.js';
import { verifyReq } from '../utils.js';

export async function register(req, res) {
  await verifyReq(req.body.walletId, req);
  const info = await wallets.register(req.body.walletId, req.body.deviceId, req.body.pinHash);
  console.log('registered wallet: %s device: %s', req.body.walletId, req.body.deviceId);
  res.status(201).send(info);
}

// Public

export async function tokenPublicPinVerify(req, res) {
  await wallets.pinVerify(req.device, req.body.pinHash, 'public');
  return res.status(200).send({
    publicToken: req.device.public_token,
  });
}

export async function tokenPublicPlatformOptions(req, res) {
  const options = await wallets.platformOptions(req.device, 'public');
  return res.status(200).send(options);
}

export async function tokenPublicPlatformVerify(req, res) {
  await wallets.platformVerify(req.device, req.body, 'public');
  return res.status(200).send({
    publicToken: req.device.public_token,
  });
}

// Private

export async function tokenPrivate(req, res) {
  if (req.device.wallet.settings['1fa_private'] === false) {
    if (req.device.wallet.authenticators.length === 0) {
      return res.status(200).send({
        privateToken: req.device.private_token,
      });
    }
  }

  throw createError(401, 'Authorization required');
}

export async function tokenPrivatePinVerify(req, res) {
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
}

export async function tokenPrivatePlatformOptions(req, res) {
  if (req.device.wallet.settings['1fa_private'] !== false) {
    const options = await wallets.platformOptions(req.device, 'private');
    return res.status(200).send(options);
  }

  throw createError(400, 'Incorrect authenticator');
}

export async function tokenPrivatePlatformVerify(req, res) {
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
}

export async function tokenPrivateCrossplatformOptions(req, res) {
  if (req.device.wallet.settings['1fa_private'] === false) {
    const options = await wallets.crossplatformOptions(req.device, 'private');
    return res.status(200).send(options);
  }

  throw createError(400, 'Incorrect authenticator');
}

export async function tokenPrivateCrossplatformVerify(req, res) {
  await wallets.crossplatformVerify(req.device, req.body, 'private');
  return res.status(200).send({
    privateToken: req.device.private_token,
  });
}

// Attestation

export async function platformAttestationOptions(req, res) {
  const options = await wallets.platformAttestationOptions(req.device);
  res.status(200).send(options);
}

export async function platformAttestationVerify(req, res) {
  await wallets.platformAttestationVerify(req.device, req.body);
  res.status(200).send({ success: true });
}

export async function crossplatformAttestationOptions(req, res) {
  const options = await wallets.crossplatformAttestationOptions(req.device);
  res.status(200).send(options);
}

export async function crossplatformAttestationVerify(req, res) {
  await wallets.crossplatformAttestationVerify(req.device, req.body);
  res.status(200).send({ success: true });
}

// API

export async function removePlatformAuthenticator(req, res) {
  await wallets.removePlatformAuthenticator(req.device);
  res.status(200).send({ success: true });
}

export async function listCrossplatformAuthenticators(req, res) {
  const list = await wallets.listCrossplatformAuthenticators(req.device);
  res.status(200).send(list);
}

export async function removeCrossplatformAuthenticator(req, res) {
  await wallets.removeCrossplatformAuthenticator(req.device, req.body.credentialID);
  res.status(200).send({ success: true });
}

export async function getSettings(req, res) {
  res.status(200).send({
    '1faPrivate': req.device.wallet.settings['1fa_private'],
    hasAuthenticators: req.device.wallet.authenticators.length !== 0,
  });
}

export async function setSettings(req, res) {
  const data = {};
  if ('1faPrivate' in req.body) {
    data['1fa_private'] = req.body['1faPrivate'];
  }
  const settings = await wallets.setSettings(req.device, data);
  res.status(200).send({
    '1faPrivate': settings['1fa_private'],
    hasAuthenticators: req.device.wallet.authenticators.length !== 0,
  });
}

export async function getDetails(req, res) {
  res.status(200).send({
    data: req.device.wallet.details,
  });
}

export async function setDetails(req, res) {
  const data = await wallets.setDetails(req.device, req.body.data);
  res.status(200).send({ data });
}

export async function getStorage(req, res) {
  const data = await storage.getStorage(req.device, req.params.storageName);
  res.status(200).send({ data });
}

export async function setStorage(req, res) {
  const data = await storage.setStorage(req.device, req.params.storageName, req.body.data);
  res.status(200).send({ data });
}

export async function setUsername(req, res) {
  const username = await wallets.setUsername(req.device, req.body.username);
  res.status(200).send({ username });
}

export async function removeDevice(req, res) {
  await wallets.removeDevice(req.device);
  res.status(200).send({ success: true });
}

export async function removeWallet(req, res) {
  await wallets.removeWallet(req.device);
  res.status(200).send({ success: true });
}

export async function searchMecto(req, res) {
  const results = await mecto.search(req.device, req.query);
  res.status(200).send(results);
}

export async function saveMecto(req, res) {
  await mecto.save(req.device, req.body);
  res.status(200).send({ success: true });
}

export async function removeMecto(req, res) {
  await mecto.remove(req.device);
  res.status(200).send({ success: true });
}

export async function moonpaySign(req, res) {
  const urls = moonpay.sign(req.body.urls);
  res.status(200).send({ urls });
}

export async function getTokens(req, res) {
  const list = await tokens.getTokens(req.query.network);
  res.status(200).send(list);
}

export async function getTicker(req, res) {
  const ticker = await tokens.getTicker(req.query.crypto);
  res.status(200).send({
    _id: ticker._id,
    prices: ticker.prices,
    // strip decimals
  });
}

export async function getTickers(req, res) {
  const tickers = await tokens.getTickers(req.query.crypto);
  res.status(200).send(tickers);
}

export async function getFees(req, res) {
  const fees = await fee.getFees(`${req.query.crypto}@${req.query.crypto}`);
  res.status(200).send(fees);
}

export async function getCsFee(req, res) {
  const fee = await csFee.getCsFee(`${req.query.crypto}@${req.query.crypto}`);
  res.status(200).send(fee);
}
