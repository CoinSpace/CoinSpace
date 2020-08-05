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

const MAX_FAILED_ATTEMPTS_FIRST = 3;
const MAX_FAILED_ATTEMPTS_SECOND = 3;

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


async function register(walletId, pin) {
  const collection = db().collection('devices');

  const id = crypto.randomBytes(64).toString('hex');
  const token = crypto.randomBytes(64).toString('hex');

  await collection.insertOne({
    _id: id,
    wallet_id: walletId,
    token,
    pin_signature: pin,
    failed_attempts_first: 0,
    failed_attempts_second: 0,
    // First Factor
    authenticator: null,
    // Second Factor
    authenticators: [],
  });

  return {
    id,
    token,
  };
}

async function login(id, pin) {
  const collection = db().collection('devices');

  const device = await _getDevice(id);

  if (device.pin_signature !== pin) {
    await _unsuccessfulFirstFactor(device);
  }

  await collection.updateOne({ _id: device._id }, { $set: { failed_attempts_first: 0 } });

  return {
    id: device._id,
    second: device.authenticators && device.authenticators.length > 0,
  };
}

async function token(id) {
  const device = await _getDevice(id);

  return {
    token: device.token,
  };
}

async function firstAttestationOptions(id) {
  const collection = db().collection('devices');
  const device = await _getDevice(id);

  const user = crypto.createHash('sha1')
    .update(device._id)
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
      authenticatorAttachment: 'platform',
    },
  });

  await collection.updateOne({ _id: device._id }, {
    $set: { challenge: options.challenge },
  });

  return options;
}

async function firstAttestationVerify(id, body) {
  const collection = db().collection('devices');
  const device = await _getDevice(id);

  const { verified, authenticatorInfo } = await verifyAttestationResponse({
    credential: body,
    expectedChallenge: device.challenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
  });

  if (verified === true) {
    await collection.updateOne({ _id: device._id }, {
      $set: {
        challenge: null,
        authenticator: {
          credentialID: authenticatorInfo.base64CredentialID,
          publicKey: authenticatorInfo.base64PublicKey,
          counter: authenticatorInfo.counter,
          date: new Date(),
        },
      },
    });
    return {
      success: true,
    };
  } else {
    throw createError(400, 'Attestation response not verified');
  }
}

async function firstAssertionOptions(id) {
  const collection = db().collection('devices');
  const device = await _getDevice(id);

  if (device.authenticator && device.authenticator.credentialID) {
    const options = generateAssertionOptions({
      challenge: generateChallenge(),
      allowedCredentialIDs: [device.authenticator.credentialID],
    });

    await collection.updateOne({ _id: device._id }, {
      $set: { challenge: options.challenge },
    });

    return options;
  } else {
    throw createError(400, 'No authenticator for first factor');
  }
}

async function firstAssertionVerify(id, body) {
  const collection = db().collection('devices');
  const device = await _getDevice(id);
  const { verified, authenticatorInfo } = await verifyAssertionResponse({
    credential: body,
    expectedChallenge: device.challenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
    authenticator: device.authenticator,
  });

  if (verified) {
    await collection.updateOne({ _id: device._id }, {
      $set: {
        challenge: null,
        authenticator: {
          ...device.authenticator,
          counter: authenticatorInfo.counter,
        },
        failed_attempts_first: 0,
      },
    });

    return {
      id: device._id,
      second: device.authenticators && device.authenticators.length > 0,
    };
  } else {
    await _unsuccessfulFirstFactor(device);
  }
}

async function secondAttestationOptions(id) {
  const collection = db().collection('devices');
  const device = await _getDevice(id);

  const user = crypto.createHash('sha1')
    .update(device._id)
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
    excludedCredentialIDs: device.authenticators ?
      device.authenticators.map(authenticator => authenticator.credentialID) : undefined,
  });

  await collection.updateOne({ _id: device._id }, {
    $set: { challenge: options.challenge },
  });

  return options;
}

async function secondAttestationVerify(id, body) {
  const collection = db().collection('devices');
  const device = await _getDevice(id);

  const { verified, authenticatorInfo } = await verifyAttestationResponse({
    credential: body,
    expectedChallenge: device.challenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
  });

  if (verified === true) {
    await collection.updateOne({ _id: device._id }, {
      $set: {
        challenge: null,
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
    return {
      success: true,
    };
  } else {
    throw createError(400, 'Attestation response not verified');
  }
}

async function secondAssertionOptions(id) {
  const collection = db().collection('devices');
  const device = await _getDevice(id);

  if (device.authenticators && device.authenticators.length > 0) {
    const options = generateAssertionOptions({
      challenge: generateChallenge(),
      allowedCredentialIDs: device.authenticators.map(authenticator => authenticator.credentialID),
    });

    await collection.updateOne({ _id: device._id }, {
      $set: { challenge: options.challenge },
    });

    return options;
  } else {
    throw createError(400, 'No authenticator for second factor');
  }
}

async function secondAssertionVerify(id, body) {
  const collection = db().collection('devices');
  const device = await _getDevice(id);

  const authenticator = device.authenticators.find(authenticator =>
    authenticator.credentialID === body.id
  );
  if (authenticator) {
    const { verified, authenticatorInfo } = await verifyAssertionResponse({
      credential: body,
      expectedChallenge: device.challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      authenticator,
    });

    if (verified) {
      authenticator.counter = authenticatorInfo.counter;

      await collection.updateOne({ _id: device._id }, {
        $set: {
          challenge: null,
          authenticators: device.authenticators,
          failed_attempts_second: 0,
        },
      });

      return {
        id: device._id,
      };
    } else {
      throw createError(400, 'Incorrect authenticator for second factor');
    }
  } else {
    await _unsuccessfulSecondFactor(device);
  }
}

// Internal

async function _getDevice(id) {
  const collection = db().collection('devices');
  const device = await collection.findOne({
    _id: id,
  });

  if (!device) {
    throw createError(404, 'Unknown device');
  }

  return device;
}

async function _unsuccessfulFirstFactor(device) {
  const collection = db().collection('devices');

  if (device.failed_attempts_first + 1 >= MAX_FAILED_ATTEMPTS_FIRST) {
    await collection.deleteOne({ _id: device._id });
    throw createError(410, 'Removed by max failed attempts');
  } else {
    await collection.updateOne({ _id: device._id }, { $inc: { failed_attempts_first: 1 } });
    throw createError(401, 'Unauthorized device');
  }
}

async function _unsuccessfulSecondFactor(device) {
  const collection = db().collection('devices');

  if (device.failed_attempts_second + 1 >= MAX_FAILED_ATTEMPTS_SECOND) {
    await collection.deleteOne({ _id: device._id });
    throw createError(410, 'Removed by max failed attempts');
  } else {
    await collection.updateOne({ _id: device._id }, { $inc: { failed_attempts_second: 1 } });
    throw createError(401, 'Unauthorized device');
  }
}

module.exports = {
  register,
  login,
  token,
  firstAttestationOptions,
  firstAttestationVerify,
  firstAssertionOptions,
  firstAssertionVerify,
  secondAttestationOptions,
  secondAttestationVerify,
  secondAssertionOptions,
  secondAssertionVerify,
};
