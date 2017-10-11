'use strict';

var axios = require('axios');
var showError = require('widgets/modal-flash').showError;

function makeRequest(config) {
  config.timeout = config.timeout || 30 * 1000;
  return axios.request(config).then(function(response) {
    return response.data;
  }).catch(function(err) {
    if (!err.response) {
      showError({message: 'Request timeout. Please check your internet connection.'});
      throw err;
    }
    throw err.response.data;
  });
}

module.exports = makeRequest
