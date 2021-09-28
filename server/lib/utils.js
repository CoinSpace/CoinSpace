import crypto from 'crypto';
import createError from 'http-errors';
import elliptic from 'elliptic';
const EdDSA = elliptic.eddsa;

const ec = new EdDSA('ed25519');

export function generateChallenge() {
  return crypto.randomBytes(64);
}

export function generateUser(id) {
  return crypto.createHash('sha1')
    .update(id)
    .digest('hex');
}

export function asyncWrapper(fn) {
  return (res, req, next) => {
    Promise.resolve(fn(res, req, next))
      .catch(next);
  };
}

export function verifyReq(key, req) {
  try {
    const base = [
      req.method.toLowerCase(),
      `${req.protocol}://${req.get('Host')}${req.originalUrl}`,
      req.get('X-Date') || '',
    ];
    if (req.get('X-Release') !== undefined) {
      base.push(req.get('X-Release'));
    }
    if (req.bodyHash) {
      base.push(req.bodyHash);
    }

    const buf = Buffer.from(base.join(' '), 'utf8');
    if (ec.keyFromPublic(key).verify(buf, req.get('Signature'))) {
      return true;
    } else {
      return Promise.reject(createError(401, 'Invalid signature'));
    }
  } catch (err) {
    throw createError(400, err.message, { expose: false });
  }
}

export function mapAuthenticator(authenticator) {
  return {
    id: authenticator.credentialID,
    type: 'public-key',
    transports: authenticator.transports || undefined,
  };
}
