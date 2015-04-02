'use strict';

var xhr = require('xhr')
var showError = require('cs-modal-flash').showError

function makeRequest(params, callback){
  if(params && !params.timeout) {
    params.timeout = 30 * 1000
  }

  xhr(params, function(err){
    if(err && err.message === 'Internal XMLHttpRequest Error') {
      return showError({ message: "Request timeout. Please check your internet connection." })
    }
    callback.apply(null, arguments)
  })
}

module.exports = makeRequest
