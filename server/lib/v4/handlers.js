import csFee from '../csFee.js';
import storage from '../storage.js';
import { verifyReq } from '../utils.js';
import wallets from '../wallets.js';
import cryptos from '../cryptos.js';
import createError from 'http-errors';

export async function getCryptos(_, res) {
  const list = await cryptos.getAll();
  res.status(200).send(list);
}

export async function getCsFee(req, res) {
  const fee = await csFee.getCsFeeV4(req.query.crypto);
  res.status(200).send(fee);
}

export async function getCsFeeAddresses(req, res) {
  const addresses = await csFee.getCsFeeAddressesV4(req.query.crypto);
  res.status(200).send(addresses);
}

export async function register(req, res) {
  await verifyReq(req.body.walletId, req);
  const info = await wallets.register(req.body.walletId, req.body.deviceId, req.body.pinHash);
  console.log('registered wallet: %s device: %s', req.body.walletId, req.body.deviceId);
  res.status(201).send(info);
}

export async function getSettings(req, res) {
  const device = await req.getDevice();
  res.status(200).send({
    '1faWallet': device.wallet.settings['1fa_wallet'],
    hasAuthenticators: device.wallet.authenticators.length !== 0,
  });
}

export async function setSettings(req, res) {
  const device = await req.getDevice();
  const data = {};
  if ('1faWallet' in req.body) {
    data['1fa_wallet'] = req.body['1faWallet'];
  }
  const settings = await wallets.setSettings(device, data);
  res.status(200).send({
    '1faWallet': settings['1fa_wallet'],
    hasAuthenticators: device.wallet.authenticators.length !== 0,
  });
}

export async function getDetails(req, res) {
  const device = await req.getDevice();
  res.status(200).send({
    data: device.wallet.details,
  });
}

export async function setDetails(req, res) {
  const device = await req.getDevice();
  const data = await wallets.setDetails(device, req.body.data);
  res.status(200).send({ data });
}

export async function getStorage(req, res) {
  const device = await req.getDevice();
  const data = await storage.getStorage(device, req.params.storageName);
  res.status(200).send({ data });
}

export async function setStorage(req, res) {
  const device = await req.getDevice();
  const data = await storage.setStorage(device, req.params.storageName, req.body.data);
  res.status(200).send({ data });
}

export async function tokenDevicePinVerify(req, res) {
  const device = await req.getDevice();
  await wallets.pinVerify(device, req.body.pinHash, 'device');
  return res.status(200).send({
    deviceToken: device.device_token,
  });
}

export async function tokenWallet(req, res) {
  const device = await req.getDevice();
  if (device.wallet.settings['1fa_wallet'] === false) {
    if (device.wallet.authenticators.length === 0) {
      return res.status(200).send({
        walletToken: device.wallet_token,
      });
    }
  }
  throw createError(401, 'Authorization required');
}

export async function tokenWalletPinVerify(req, res) {
  const device = await req.getDevice();
  if (device.wallet.settings['1fa_wallet'] !== false) {
    await wallets.pinVerify(device, req.body.pinHash, 'wallet');
    if (device.wallet.authenticators.length === 0) {
      return res.status(200).send({
        walletToken: device.wallet_token,
      });
    } else {
      const options = await wallets.crossplatformOptions(device, 'wallet');
      return res.status(200).send(options);
    }
  }
  throw createError(400, 'Incorrect authenticator');
}

export async function tokenWalletCrossplatformOptions(req, res) {
  const device = await req.getDevice();
  if (device.wallet.settings['1fa_wallet'] === false) {
    const options = await wallets.crossplatformOptions(device, 'wallet');
    return res.status(200).send(options);
  }

  throw createError(400, 'Incorrect authenticator');
}

export async function tokenWalletCrossplatformVerify(req, res) {
  const device = await req.getDevice();
  await wallets.crossplatformVerify(device, req.body, 'wallet');
  return res.status(200).send({
    walletToken: device.wallet_token,
  });
}

export async function platformRegistrationOptions(req, res) {
  const device = await req.getDevice();
  const options = await wallets.platformRegistrationOptions(device);
  res.status(200).send(options);
}

export async function platformRegistrationVerify(req, res) {
  const device = await req.getDevice();
  await wallets.platformRegistrationVerify(device, req.body);
  res.status(200).send({ success: true });
}

export async function crossplatformRegistrationOptions(req, res) {
  const device = await req.getDevice();
  const options = await wallets.crossplatformRegistrationOptions(device);
  res.status(200).send(options);
}

export async function crossplatformRegistrationVerify(req, res) {
  const device = await req.getDevice();
  await wallets.crossplatformRegistrationVerify(device, req.body);
  res.status(200).send({ success: true });
}

export async function tokenDevicePlatformOptions(req, res) {
  const device = await req.getDevice();
  const options = await wallets.platformOptions(device, 'device');
  return res.status(200).send(options);
}

export async function tokenDevicePlatformVerify(req, res) {
  const device = await req.getDevice();
  await wallets.platformVerify(device, req.body, 'device');
  return res.status(200).send({
    deviceToken: device.device_token,
  });
}

export async function listCrossplatformAuthenticators(req, res) {
  const device = await req.getDevice();
  const list = await wallets.listCrossplatformAuthenticators(device);
  res.status(200).send(list);
}

export async function removeCrossplatformAuthenticator(req, res) {
  const device = await req.getDevice();
  await wallets.removeCrossplatformAuthenticator(device, req.body.credentialID);
  res.status(200).send({ success: true });
}

export async function removePlatformAuthenticator(req, res) {
  const device = await req.getDevice();
  await wallets.removePlatformAuthenticator(device);
  res.status(200).send({ success: true });
}

export async function removeWallet(req, res) {
  const device = await req.getDevice();
  await wallets.removeWallet(device);
  res.status(200).send({ success: true });
}

export async function setUsername(req, res) {
  const device = await req.getDevice();
  const username = await wallets.setUsername(device, req.body.username);
  res.status(200).send({ username });
}
