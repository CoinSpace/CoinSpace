'use strict';

const axios = require('axios').create({ timeout: 30000 });
const axiosRetry = require('axios-retry');
const { showError } = require('widgets/modals/flash');
const { eddsa } = require('elliptic');
const ec = new eddsa('ed25519');
const crypto = require('crypto');
const seeds = require('lib/wallet/seeds');

axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay, shouldResetTimeout: true });

function makeRequest(config, callback) {
  const showFlashError = !config.hideFlashError;

  if (config.seed) {
    const secret = seeds.get(config.seed);
    const privateKey = ec.keyFromSecret(secret);

    const body = config.data && JSON.stringify(config.data);
    const date = (new Date()).toUTCString();
    const base = [
      config.method,
      config.url,
      location.host,
      date,
    ];
    if (config.method !== 'gets' && body) {
      base.push(crypto.createHash('sha256').update(body).digest().toString('hex'));
    }
    const signature = privateKey.sign(Buffer.from(base.join(' '))).toHex();
    config.headers = config.headers || {};
    config.headers['X-Date'] = date;
    config.headers['Signature'] = signature;
  }

  return axios.request(config)
    .then((response) => {
      return response.data;
    })
    .catch((err) => {
      // TODO handle 401
      if (err.response) {
        const error = new Error(err.response.data.error || err.response.data.message || err.response.data);
        error.status = err.response.status;
        error.url = err.config.url;
        error.method = err.config.method;
        throw error;
      } else if (err.request) {
        if (showFlashError) {
          showError({ message: 'Request timeout. Please check your internet connection.' });
        }
        throw err;
      } else {
        throw err;
      }
    })
    .then((data) => {
      if (callback) {
        setTimeout(() => {
          callback(null, data);
        });
      }
      return data;
    }, (err) => {
      if (callback) {
        setTimeout(() => {
          callback(err);
        });
      } else {
        throw err;
      }
    });
}

module.exports = makeRequest;
