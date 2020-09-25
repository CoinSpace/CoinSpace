'use strict';

const crypto = require('crypto');
const createError = require('http-errors');
const {
  generateAttestationOptions,
  verifyAttestationResponse,
  generateAssertionOptions,
  verifyAssertionResponse,
} = require('@simplewebauthn/server');
const db = require('../v1/db');
const { generateChallenge, generateUser } = require('./utils');

const COLLECTION = 'wallets';
const MAX_FAILED_ATTEMPTS = 3;

const url = new URL(process.env.SITE_URL);

const RP_NAME = require('../../../package.json').description;
const RP_ID = url.hostname;
const ORIGIN = url.origin;

const fidoAlgorithmIDs = [
  // ES256
  -7,
  // ES384
  -35,
  // ES512
  -36,
  // PS256
  -37,
  // PS384
  -38,
  // PS512
  -39,
  // EdDSA
  -8,
  // RS256 (not recommended)
  -257,
  // RS384 (not recommended)
  -258,
  // RS512 (not recommended)
  -259,
];


async function register(walletId, deviceId, pinHash) {
  const wallets = db().collection(COLLECTION);

  const publicToken = crypto.randomBytes(64).toString('hex');
  const privateToken = crypto.randomBytes(64).toString('hex');

  await wallets.updateOne({
    _id: walletId,
    'devices._id': { $ne: deviceId },
  }, {
    $setOnInsert: {
      authenticators: [],
      details: null,
      settings: {
        '1fa_private': true,
      },
    },
    $push: {
      devices: {
        _id: deviceId,
        pin_hash: pinHash,
        authenticator: null,
        public_token: publicToken,
        private_token: privateToken,
        failed_attempts: {},
        challenges: {},
      },
    },
  }, {
    upsert: true,
  }).catch((err) => {
    if (err.name === 'MongoError' && err.code === 11000) {
      throw createError(400, err.message, { expose: false });
    }
    throw err;
  });

  return {
    publicToken,
    privateToken,
  };
}

async function pinVerify(device, pinHash, type) {
  if (device.pin_hash !== pinHash) {
    await _unsuccessfulAuth(device, type, 'pin');
  }
  const wallets = db().collection(COLLECTION);
  await wallets.updateOne({
    'devices._id': device._id,
  }, {
    $set: {
      [`devices.$.failed_attempts.${type}_pin`]: 0,
      [`devices.$.failed_attempts.${type}_platform`]: 0,
    },
  });
}

async function platformOptions(device, type) {
  if (device.authenticator && device.authenticator.credentialID) {
    const options = generateAssertionOptions({
      challenge: generateChallenge(),
      allowedCredentialIDs: [device.authenticator.credentialID],
    });
    await _setChallenge(device, options.challenge, type, 'platform');

    return options;
  } else {
    throw createError(400, 'No authenticator');
  }
}

async function platformVerify(device, body, type) {
  const { verified, authenticatorInfo } = await verifyAssertionResponse({
    credential: body,
    expectedChallenge: device.challenges[`${type}_platform`],
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
    authenticator: device.authenticator,
  });

  if (!verified) {
    await _unsuccessfulAuth(device, type, 'platform');
  }
  const wallets = db().collection(COLLECTION);
  await wallets.updateOne({
    'devices._id': device._id,
  }, {
    $set: {
      [`devices.$.failed_attempts.${type}_pin`]: 0,
      [`devices.$.failed_attempts.${type}_platform`]: 0,
      [`devices.$.challenges.${type}_platform`]: null,
      'devices.$.authenticator.counter': authenticatorInfo.counter,
    },
  });
}

async function crossplatformOptions(device, type) {
  const { wallet } = device;
  if (wallet.authenticators && wallet.authenticators.length > 0) {
    const options = generateAssertionOptions({
      challenge: generateChallenge(),
      allowedCredentialIDs: wallet.authenticators.map(authenticator => authenticator.credentialID),
    });

    await _setChallenge(device, options.challenge, type, 'crossplatform');

    return options;
  } else {
    throw createError(400, 'No authenticator');
  }
}

async function crossplatformVerify(device, body, type) {
  const { wallet } = device;

  const authenticator = wallet.authenticators.find(authenticator =>
    authenticator.credentialID === body.id
  );
  if (!authenticator) {
    throw createError(400, 'Incorrect authenticator');
  }
  const { verified, authenticatorInfo } = await verifyAssertionResponse({
    credential: body,
    expectedChallenge: device.challenges[`${type}_crossplatform`],
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
    authenticator,
  });

  if (!verified) {
    await _unsuccessfulAuth(device, type, 'crossplatform');
  }
  const wallets = db().collection(COLLECTION);
  await wallets.updateOne({
    'devices._id': device._id,
  }, {
    $set: {
      [`devices.$.failed_attempts.${type}_crossplatform`]: 0,
      [`devices.$.challenges.${type}_crossplatform`]: null,
    },
  });
  await wallets.updateOne({
    _id: device.wallet._id,
    'authenticators.credentialID': authenticatorInfo.base64CredentialID,
  }, {
    $set: {
      'authenticators.$.counter': authenticatorInfo.counter,
    },
  });
}

// Attestation

async function platformAttestationOptions(device) {
  const user = generateUser(device._id);
  const options = generateAttestationOptions({
    challenge: generateChallenge(),
    serviceName: RP_NAME,
    rpID: RP_ID,
    userID: user,
    userName: user,
    attestationType: 'none',
    supportedAlgorithmIDs: fidoAlgorithmIDs,
    authenticatorSelection: {
      // TODO: uncomment before prod
      //authenticatorAttachment: 'platform',
    },
  });
  await _setChallenge(device, options.challenge, 'attestation', 'platform');

  return options;
}

async function platformAttestationVerify(device, body) {
  const { verified, authenticatorInfo } = await verifyAttestationResponse({
    credential: body,
    expectedChallenge: device.challenges['attestation_platform'],
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
  });

  if (!verified) {
    throw createError(400, 'Attestation response not verified');
  }
  const wallets = db().collection(COLLECTION);
  await wallets.updateOne({
    'devices._id': device._id,
  }, {
    $set: {
      'devices.$.challenges.attestation_platform': null,
      'devices.$.authenticator': {
        credentialID: authenticatorInfo.base64CredentialID,
        publicKey: authenticatorInfo.base64PublicKey,
        counter: authenticatorInfo.counter,
        date: new Date(),
      },
    },
  });
}

async function crossplatformAttestationOptions(device) {
  const { wallet } = device;
  const user = generateUser(wallet._id);

  const options = generateAttestationOptions({
    challenge: generateChallenge(),
    serviceName: RP_NAME,
    rpID: RP_ID,
    userID: user,
    userName: user,
    attestationType: 'none',
    supportedAlgorithmIDs: fidoAlgorithmIDs,
    authenticatorSelection: {
      authenticatorAttachment: 'cross-platform',
    },
    excludedCredentialIDs: wallet.authenticators ?
      wallet.authenticators.map(authenticator => authenticator.credentialID) : undefined,
  });

  await _setChallenge(device, options.challenge, 'attestation', 'crossplatform');

  return options;
}

async function crossplatformAttestationVerify(device, body) {
  const { verified, authenticatorInfo } = await verifyAttestationResponse({
    credential: body,
    expectedChallenge: device.challenges['attestation_crossplatform'],
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
  });

  if (!verified) {
    throw createError(400, 'Attestation response not verified');
  }
  const wallets = db().collection(COLLECTION);
  await wallets.updateOne({
    'devices._id': device._id,
  }, {
    $set: {
      'devices.$.challenges.attestation_crossplatform': null,
    },
    $push: {
      authenticators: {
        credentialID: authenticatorInfo.base64CredentialID,
        publicKey: authenticatorInfo.base64PublicKey,
        counter: authenticatorInfo.counter,
        date: new Date(),
      },
    },
  });
}

async function listCrossplatformAuthenticators(device) {
  return device.wallet.authenticators.map(item => {
    return {
      credentialID: item.credentialID,
      date: item.date,
    };
  });
}

async function removeCrossplatformAuthenticator(device, credentialID) {
  const wallets = db().collection(COLLECTION);
  await wallets.updateOne({
    'devices._id': device._id,
    'authenticators.credentialID': credentialID,
  }, {
    // It doesn't works with dot notation =(
    $pull: { authenticators: { credentialID } },
  });
}

async function setSettings(device, data) {
  const settings = {
    ...device.wallet.settings,
    ...data,
  };
  await db().collection(COLLECTION)
    .updateOne({ _id: device.wallet._id }, { $set: { settings } });
  return settings;
}

async function setDetails(device, details) {
  await db().collection(COLLECTION)
    .updateOne({ _id: device.wallet._id }, { $set: { details } });
  return details;
}

async function setUsername(device, username) {
  username = username.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const usernameSha = crypto.createHash('sha1')
    .update(username + process.env.USERNAME_SALT)
    .digest('hex');

  await db().collection(COLLECTION)
    .updateOne({ _id: device.wallet._id }, { $set: { username_sha: usernameSha } }, { upsert: true })
    .catch((err) => {
      if (err.name === 'MongoError' && err.code === 11000) {
        throw createError(400, 'Username already taken');
      }
      throw err;
    });
  return username;
}

async function removeDevice(device) {
  const wallets = db().collection(COLLECTION);
  const res = await wallets.updateOne({
    'devices._id': device._id,
  }, {
    // It doesn't works with dot notation =(
    $pull: { devices: { _id: device._id } },
  });
  if (res.modifiedCount !== 1) {
    throw createError(404, 'Unknown device');
  }
}

async function removeWallet(device) {
  const wallets = db().collection(COLLECTION);
  const res = await wallets.removeOne({
    'devices._id': device._id,
  });
  if (res.deletedCount !== 1) {
    throw createError(404, 'Unknown wallet');
  }
}

async function getDevice(deviceId) {
  const wallets = db().collection(COLLECTION);
  const wallet = await wallets.findOne({
    'devices._id': deviceId,
  });

  if (!wallet) {
    throw createError(404, 'Unknown wallet');
  }
  // Current device
  const device = wallet.devices.find(item => item._id === deviceId);
  device.wallet = wallet;
  return device;
}

// Internal

async function _unsuccessfulAuth(device, tokenType, authType) {
  const wallets = db().collection(COLLECTION);
  const attempt = (device.failed_attempts || {})[`${tokenType}_${authType}`] || 0;

  if (attempt + 1 >= MAX_FAILED_ATTEMPTS) {
    await wallets.updateOne({
      'devices._id': device._id,
    }, {
      // It doesn't works with dot notation =(
      $pull: { devices: { _id: device._id } },
    });
    throw createError(410, 'Removed by max failed attempts');
  } else {
    await wallets.updateOne({
      'devices._id': device._id,
    }, {
      $inc: { [`devices.$.failed_attempts.${tokenType}_${authType}`]: 1 },
    });
    throw createError(401, 'Unauthorized device');
  }
}

async function _setChallenge(device, challenge, tokenType, authType) {
  const wallets = db().collection(COLLECTION);
  await wallets.updateOne({
    'devices._id': device._id,
  }, {
    $set: { [`devices.$.challenges.${tokenType}_${authType}`]: challenge },
  });
}

module.exports = {
  register,
  // PIN
  pinVerify,
  // Platform
  platformOptions,
  platformVerify,
  // Cross-platform
  crossplatformOptions,
  crossplatformVerify,
  // Attestation
  platformAttestationOptions,
  platformAttestationVerify,
  crossplatformAttestationOptions,
  crossplatformAttestationVerify,
  // API
  listCrossplatformAuthenticators,
  removeCrossplatformAuthenticator,
  setSettings,
  setDetails,
  setUsername,
  removeDevice,
  removeWallet,
  getDevice,
};
