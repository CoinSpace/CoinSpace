'use strict';

const axios = require('axios').create({ timeout: 30000 });
const axiosRetry = require('axios-retry');
const { showError } = require('widgets/modals/flash');

axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay, shouldResetTimeout: true });

function makeRequest(config, callback) {
  const showFlashError = !config.hideFlashError;
  return axios.request(config).then(function(response) {
    return response.data;
  }).catch(function(err) {
    if (err.response) {
      const error = new Error(err.response.data.error || err.response.data.message || err.response.data);
      error.status = err.response.status;
      error.url = err.config.url;
      error.method = err.config.method;
      throw error;
    } else if (err.request) {
      if (showFlashError) showError({ message: 'Request timeout. Please check your internet connection.' });
      throw err;
    } else {
      throw err;
    }
  }).then(function(data) {
    if (callback) {
      setTimeout(function() {
        callback(null, data);
      });
    }
    return data;
  }, function(err) {
    if (callback) {
      setTimeout(function() {
        callback(err);
      });
    } else {
      return Promise.reject(err);
    }
  });
}

module.exports = makeRequest;
