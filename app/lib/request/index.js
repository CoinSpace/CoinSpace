'use strict';

var axios = require('axios');
var axiosRetry = require('axios-retry');
axiosRetry(axios, {retries: 3, retryDelay: axiosRetry.exponentialDelay, shouldResetTimeout: true});
var showError = require('widgets/modals/flash').showError;

function makeRequest(config, callback) {
  config.timeout = config.timeout || 30 * 1000;
  var showFlashError = !config.hideFlashError;
  return axios.request(config).then(function(response) {
    return response.data;
  }).catch(function(err) {
    if (err.response) {
      var error = new Error(err.response.data.error || err.response.data.message || err.response.data);
      error.status = err.response.status;
      error.url = err.config.url;
      error.method = err.config.method;
      throw error;
    } else if (err.request) {
      if (showFlashError) showError({message: 'Request timeout. Please check your internet connection.'});
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

module.exports = makeRequest
