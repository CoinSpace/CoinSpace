'use strict';

const crypto = require('crypto');

function generateChallenge() {
  return crypto.randomBytes(64);
}

function asyncWrapper(fn) {
  return (res, req, next) => {
    Promise.resolve(fn(res, req, next))
      .catch(next);
  };
}

module.exports = {
  generateChallenge,
  asyncWrapper,
};
