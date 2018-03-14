'use strict';

var axios = require('axios');
var showError = require('widgets/modals/flash').showError;

function makeRequest(config, callback) {
  config.timeout = config.timeout || 30 * 1000;
  return axios.request(config).then(function(response) {
    return response.data;
  }).catch(function(err) {
    if (!err.response) {
      showError({message: 'Request timeout. Please check your internet connection.'});
      throw err;
    }
    throw new Error(err.response.data.error);
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
