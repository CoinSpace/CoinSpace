'use strict';

const axios = require('axios').create({ timeout: 30000 });
const buildURL = require('axios/lib/helpers/buildURL.js');
const axiosRetry = require('axios-retry');
const LS = require('lib/wallet/localStorage');
const { showError } = require('widgets/modals/flash');
const { eddsa } = require('elliptic');
const ec = new eddsa('ed25519');
const crypto = require('crypto');
const seeds = require('lib/wallet/seeds');

axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay, shouldResetTimeout: true });

axios.interceptors.request.use((config) => {
  if (!config.url.startsWith(window.urlRoot)) {
    return config;
  }
  if (!config.method) {
    config.method = 'get';
  }

  if ((config.seed && config.id !== false) || config.id === true) {
    // object spread not supported
    config.params = Object.assign({
      id: LS.getId(),
    }, config.params);
  }

  if (config.params) {
    config.url = buildURL(config.url, config.params);
    delete config.params;
  }

  const date = (new Date()).toUTCString();
  config.headers = config.headers || {};
  config.headers['X-Release'] = process.env.RELEASE;
  config.headers['X-Date'] = date;

  if (config.seed) {
    const secret = seeds.get(config.seed);
    const privateKey = ec.keyFromSecret(secret);

    const body = config.data && JSON.stringify(config.data);
    const base = [
      config.method,
      config.url,
      date,
      process.env.RELEASE,
    ];
    if (config.method !== 'get' && body) {
      base.push(crypto.createHash('sha256').update(body).digest().toString('hex'));
    }
    const signature = privateKey.sign(Buffer.from(base.join(' '))).toHex();
    config.headers['Signature'] = signature;
  }

  return config;
});

function makeRequest(config, callback) {
  if (callback) {
    throw new Error('Callback style not supported!');
  }
  const showFlashError = !config.hideFlashError;

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
    });
}

module.exports = makeRequest;
