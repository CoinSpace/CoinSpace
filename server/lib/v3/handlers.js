import createError from 'http-errors';
import semver from 'semver';
import wallets from '../wallets.js';
import cryptos from '../cryptos.js';
import fee from '../fee.js';
import csFee from '../csFee.js';
import mecto from '../mecto.js';
import storage from '../storage.js';
import moonpay from '../moonpay.js';
import openalias from '../openalias.js';
import github from '../github.js';
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

export async function getCryptos(req, res) {
  const list = await cryptos.getAll();
  res.status(200).send(list);
}

export async function getTicker(req, res) {
  const ticker = await cryptos.getTicker(req.query.crypto);
  if (!ticker) {
    throw createError(404, 'Crypto not found');
  }
  res.status(200).send(ticker);
}

export async function getTickers(req, res) {
  const tickers = await cryptos.getTickers(req.query.crypto);
  res.status(200).send(tickers);
}

export async function getFees(req, res) {
  const fees = await fee.getFees(req.query.crypto);
  res.status(200).send(fees);
}

export async function getCsFee(req, res) {
  const fee = await csFee.getCsFee(req.query.crypto);
  res.status(200).send(fee);
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

export async function getStorage(req, res) {
  const data = await storage.getStorage(req.device, req.params.storageName);
  res.status(200).send({ data });
}

export async function setStorage(req, res) {
  const data = await storage.setStorage(req.device, req.params.storageName, req.body.data);
  res.status(200).send({ data });
}

export async function moonpaySign(req, res) {
  const urls = moonpay.sign(req.body.urls);
  res.status(200).send({ urls });
}

export async function resolveOpenalias(req, res) {
  const data = await openalias.resolve(req.query.hostname);
  res.status(200).send(data);
}

export async function getUpdates(req, res) {
  const updates = await github.getUpdates();
  res.status(200).send(updates.map((item) => {
    return {
      name: item.name,
      version: item.version,
      url: item.url,
      distribution: item.distribution,
      arch: item.arch,
      app: item.app,
    };
  }));
}

export async function getUpdate(req, res) {
  const app = req.get('User-Agent').includes('CoinSpace') ? 'electron' : 'app';
  const { distribution, arch, version } = req.params;
  if (!semver.valid(version)) {
    throw createError(400, `Invalid SemVer: "${version}"`);
  }
  const update = await github.getUpdate(distribution, arch, app);
  if (!update) {
    throw createError(404, 'Unsupported platform');
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
}

export async function getWinReleases(req, res) {
  const { version } = req.params;
  if (!semver.valid(version)) {
    throw createError(400, `Invalid SemVer: "${version}"`);
  }
  const update = await github.getUpdate('win', 'x64', 'electron');
  if (!update) {
    throw createError(404, 'Unsupported platform');
  } else {
    res.status(200).send(update.content);
  }
}

export async function downloadApp(req, res) {
  const { distribution, arch } = req.params;
  const update = await github.getUpdate(distribution, arch, 'app');
  if (!update) {
    res.redirect(302, `https://github.com/${github.account}/releases/latest`);
  } else {
    res.redirect(302, update.url);
  }
}
