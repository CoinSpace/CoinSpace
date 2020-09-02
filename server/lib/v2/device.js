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
const { generateChallenge } = require('./utils');

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
        auth_for_pivate: true,
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
        challenge: null,
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

async function tokenPublicPinVerify(deviceId, pinHash) {
  const wallet = await getWallet(deviceId);

  if (wallet.device.pin_hash !== pinHash) {
    await _unsuccessfulAuth(wallet, 'public', 'pin');
  }
  await _successfulAuth(wallet, 'public', 'pin');

  return {
    publicToken: wallet.device.public_token,
  };
}

async function tokenPublicPlatformOptions(deviceId) {
  const wallet = await getWallet(deviceId);

  if (wallet.device.authenticator && wallet.device.authenticator.credentialID) {
    const options = generateAssertionOptions({
      challenge: generateChallenge(),
      allowedCredentialIDs: [wallet.device.authenticator.credentialID],
    });
    await _setChallenge(wallet, options.challenge);

    return options;
  } else {
    throw createError(400, 'No authenticator');
  }
}

async function tokenPublicPlatformVerify(deviceId, body) {
  const wallet = await getWallet(deviceId);

  const { verified, authenticatorInfo } = await verifyAssertionResponse({
    credential: body,
    expectedChallenge: wallet.device.challenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
    authenticator: wallet.device.authenticator,
  });

  if (verified) {
    await _successfulAuth(wallet, 'public', 'platform');
    await _updateAuthenticatorPlatform(wallet, authenticatorInfo);

    return {
      publicToken: wallet.device.public_token,
    };
  } else {
    await _unsuccessfulAuth(wallet, 'public', 'platform');
  }
}

async function tokenPrivate(deviceId) {
  const wallet = await getWallet(deviceId);
  if (wallet.settings.auth_for_pivate === false && wallet.authenticators.length === 0) {
    return {
      privateToken: wallet.device.private_token,
    };
  }
  throw createError(401, 'Authorization required');
}

async function tokenPrivatePinVerify(deviceId, pinHash) {
  const wallet = await getWallet(deviceId);

  if (wallet.settings.auth_for_pivate === true) {
    if (wallet.device.pin_hash !== pinHash) {
      await _unsuccessfulAuth(wallet, 'private', 'pin');
    }
    await _successfulAuth(wallet, 'private', 'pin');

    if (wallet.authenticators.length === 0) {
      return {
        privateToken: wallet.device.private_token,
      };
    }
    return tokenPrivateCrossplatformOptions(deviceId);
  }
  throw createError(400, 'Incorrect authenticator');
}

async function tokenPrivatePlatformOptions(deviceId) {
  const wallet = await getWallet(deviceId);

  if (wallet.device.authenticator && wallet.device.authenticator.credentialID) {
    const options = generateAssertionOptions({
      challenge: generateChallenge(),
      allowedCredentialIDs: [wallet.device.authenticator.credentialID],
    });
    await _setChallenge(wallet, options.challenge);

    return options;
  } else {
    throw createError(400, 'No authenticator');
  }
}

async function tokenPrivatePlatformVerify(deviceId, body) {
  const wallet = await getWallet(deviceId);

  const { verified, authenticatorInfo } = await verifyAssertionResponse({
    credential: body,
    expectedChallenge: wallet.device.challenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
    authenticator: wallet.device.authenticator,
  });

  if (verified) {
    await _successfulAuth(wallet, 'private', 'platform');
    await _updateAuthenticatorPlatform(wallet, authenticatorInfo);

    if (wallet.authenticators.length === 0) {
      return {
        privateToken: wallet.device.private_token,
      };
    }
    return tokenPrivateCrossplatformOptions(deviceId);
  } else {
    await _unsuccessfulAuth(wallet, 'private', 'platform');
  }
}

async function tokenPrivateCrossplatformOptions(deviceId) {
  const wallet = await getWallet(deviceId);

  if (wallet.authenticators && wallet.authenticators.length > 0) {
    const options = generateAssertionOptions({
      challenge: generateChallenge(),
      allowedCredentialIDs: wallet.authenticators.map(authenticator => authenticator.credentialID),
    });

    await _setChallenge(wallet, options.challenge);

    return options;
  } else {
    throw createError(400, 'No authenticator');
  }
}

async function tokenPrivateCrossplatformVerify(deviceId, body) {
  const wallet = await getWallet(deviceId);

  const authenticator = wallet.authenticators.find(authenticator =>
    authenticator.credentialID === body.id
  );
  if (authenticator) {
    const { verified, authenticatorInfo } = await verifyAssertionResponse({
      credential: body,
      expectedChallenge: wallet.device.challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      authenticator,
    });

    if (verified) {
      await _successfulAuth(wallet, 'private', 'crossplatform');
      await _updateAuthenticatorCrossplatform(wallet, authenticatorInfo);

      return {
        privateToken: wallet.device.private_token,
      };
    } else {
      throw createError(400, 'Incorrect authenticator');
    }
  } else {
    await _unsuccessfulAuth(wallet, 'private', 'crossplatform');
  }
}

// Attestation

async function platformAttestationOptions(deviceId) {
  const wallet = await getWallet(deviceId);

  const user = crypto.createHash('sha1')
    .update(wallet.device._id)
    .digest('hex');

  const options = generateAttestationOptions({
    challenge: generateChallenge(),
    serviceName: RP_NAME,
    rpID: RP_ID,
    userID: user,
    userName: user,
    attestationType: 'none',
    supportedAlgorithmIDs: fidoAlgorithmIDs,
    authenticatorSelection: {
      //authenticatorAttachment: 'platform',
    },
  });
  await _setChallenge(wallet, options.challenge);

  return options;
}

async function platformAttestationVerify(deviceId, body) {
  const wallet = await getWallet(deviceId);

  const { verified, authenticatorInfo } = await verifyAttestationResponse({
    credential: body,
    expectedChallenge: wallet.device.challenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
  });

  if (verified === true) {
    await _setAuthenticatorPlatform(wallet, authenticatorInfo);
    return {
      success: true,
    };
  } else {
    throw createError(400, 'Attestation response not verified');
  }
}

async function crossplatformAttestationOptions(deviceId) {
  const wallet = await getWallet(deviceId);

  const user = crypto.createHash('sha1')
    .update(wallet._id)
    .digest('hex');

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

  await _setChallenge(wallet, options.challenge);

  return options;
}

async function crossplatformAttestationVerify(deviceId, body) {
  const wallet = await getWallet(deviceId);

  const { verified, authenticatorInfo } = await verifyAttestationResponse({
    credential: body,
    expectedChallenge: wallet.device.challenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
  });

  if (verified === true) {
    await _setAuthenticatorCrossplatform(wallet, authenticatorInfo);
    return {
      success: true,
    };
  } else {
    throw createError(400, 'Attestation response not verified');
  }
}

async function listCrossplatformAuthenticators(deviceId) {
  const wallet = await getWallet(deviceId);
  return wallet.authenticators.map(item => {
    return {
      credentialID: item.credentialID,
      date: item.date,
    };
  });
}

async function removeCrossplatformAuthenticator(deviceId, credentialID) {
  const wallets = db().collection(COLLECTION);
  await wallets.updateOne({
    'devices._id': deviceId,
    'authenticators.credentialID': credentialID,
  }, {
    // It doesn't works with dot notation =(
    $pull: { authenticators: { credentialID } },
  });
  return {
    success: true,
  };
}

async function getDetails(deviceId) {
  const wallet = await getWallet(deviceId);
  return wallet.details;
}

async function setDetails(deviceId, details) {
  const wallet = await getWallet(deviceId);
  await db().collection(COLLECTION)
    .updateOne({ _id: wallet._id }, { $set: { details } });
  return details;
}

async function setUsername(deviceId, username) {
  const wallet = await getWallet(deviceId);
  username = username.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const usernameSha = crypto.createHash('sha1')
    .update(username + process.env.USERNAME_SALT)
    .digest('hex');

  await db().collection(COLLECTION)
    .updateOne({ _id: wallet._id }, { $set: { username_sha: usernameSha } }, { upsert: true })
    .catch((err) => {
      if (err.name === 'MongoError' && err.code === 11000) {
        throw createError(400, 'Username already taken');
      }
      throw err;
    });
  return username;
}

async function removeDevice(deviceId) {
  const wallets = db().collection(COLLECTION);
  await wallets.updateOne({
    'devices._id': deviceId,
  }, {
    // It doesn't works with dot notation =(
    $pull: { devices: { _id: deviceId } },
  });
  return {
    success: true,
  };
}

async function removeWallet(deviceId) {
  const wallets = db().collection(COLLECTION);
  await wallets.removeOne({
    'devices._id': deviceId,
  });
  return {
    success: true,
  };
}

// Internal

async function getWallet(deviceId) {
  const wallets = db().collection(COLLECTION);
  const wallet = await wallets.findOne({
    'devices._id': deviceId,
  });

  if (!wallet) {
    throw createError(404, 'Unknown wallet');
  }
  // Current device
  wallet.device = wallet.devices.find(item => item._id === deviceId);

  return wallet;
}

async function _successfulAuth(wallet, tokenType, authType) {
  const wallets = db().collection(COLLECTION);

  await wallets.updateOne({
    'devices._id': wallet.device._id,
  }, {
    $set: {
      [`devices.$.failed_attempts.${tokenType}_${authType}`]: 0,
    },
  });
}

async function _unsuccessfulAuth(wallet, tokenType, authType) {
  const wallets = db().collection(COLLECTION);
  const attempt = (wallet.device.failed_attempts || {})[`${tokenType}_${authType}`] || 0;

  if (attempt + 1 >= MAX_FAILED_ATTEMPTS) {
    await wallets.updateOne({
      'devices._id': wallet.device._id,
    }, {
      // It doesn't works with dot notation =(
      $pull: { devices: { _id: wallet.device._id } },
    });
    throw createError(410, 'Removed by max failed attempts');
  } else {
    await wallets.updateOne({
      'devices._id': wallet.device._id,
    }, {
      $inc: { [`devices.$.failed_attempts.${tokenType}_${authType}`]: 1 },
    });
    throw createError(401, 'Unauthorized device');
  }
}

async function _setChallenge(wallet, challenge) {
  const wallets = db().collection(COLLECTION);
  await wallets.updateOne({
    'devices._id': wallet.device._id,
  }, {
    $set: { 'devices.$.challenge': challenge },
  });
}

async function _setAuthenticatorPlatform(wallet, authenticatorInfo) {
  const wallets = db().collection(COLLECTION);
  await wallets.updateOne({
    'devices._id': wallet.device._id,
  }, {
    $set: {
      'devices.$.challenge': null,
      'devices.$.authenticator': {
        credentialID: authenticatorInfo.base64CredentialID,
        publicKey: authenticatorInfo.base64PublicKey,
        counter: authenticatorInfo.counter,
        date: new Date(),
      },
    },
  });
}

async function _updateAuthenticatorPlatform(wallet, authenticatorInfo) {
  const wallets = db().collection(COLLECTION);
  await wallets.updateOne({
    'devices._id': wallet.device._id,
  }, {
    $set: {
      'devices.$.challenge': null,
      'devices.$.authenticator.counter': authenticatorInfo.counter,
    },
  });
}

async function _setAuthenticatorCrossplatform(wallet, authenticatorInfo) {
  const wallets = db().collection(COLLECTION);
  await wallets.updateOne({
    'devices._id': wallet.device._id,
  }, {
    $set: {
      'devices.$.challenge': null,
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

async function _updateAuthenticatorCrossplatform(wallet, authenticatorInfo) {
  const wallets = db().collection(COLLECTION);
  await wallets.updateOne({
    _id: wallet._id,
    'authenticators.credentialID': authenticatorInfo.base64CredentialID,
  }, {
    $set: {
      'authenticators.$.counter': authenticatorInfo.counter,
    },
  });
}

module.exports = {
  register,

  tokenPublicPinVerify,
  tokenPublicPlatformOptions,
  tokenPublicPlatformVerify,

  tokenPrivate,
  tokenPrivatePinVerify,
  tokenPrivatePlatformOptions,
  tokenPrivatePlatformVerify,
  tokenPrivateCrossplatformOptions,
  tokenPrivateCrossplatformVerify,

  platformAttestationOptions,
  platformAttestationVerify,
  crossplatformAttestationOptions,
  crossplatformAttestationVerify,

  listCrossplatformAuthenticators,
  removeCrossplatformAuthenticator,
  getDetails,
  setDetails,
  setUsername,
  removeDevice,
  removeWallet,

  getWallet,
};
