'use strict';

const axios = require('axios').create({ timeout: 30000 });
const axiosRetry = require('axios-retry');
const { showError } = require('widgets/modals/flash');

axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay, shouldResetTimeout: true });

const state = {};

function makeRequest(config, callback) {
  const showFlashError = !config.hideFlashError;

  if (config.jwt !== false && (config.jwt || state.jwt) && config.url.includes('/v2/')) {
    if (!config.headers) {
      config.headers = {};
    }
    config.headers['Authorization'] = `Bearer ${config.jwt || state.jwt}`;
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
      if (data.jwt) {
        state.jwt = data.jwt;
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
