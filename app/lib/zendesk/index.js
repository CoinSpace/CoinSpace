'use strict';

var xhr = require('cs-xhr')

function sendRequest(paramsObj, callback) {
  // Coin Space version := Coin Space
  paramsObj['fields[24464158]'] = 'coinspace-js'
  // Browser := user agent
  paramsObj['fields[24464168]'] = navigator.userAgent

  var params = Object.keys(paramsObj).map(function(key) {
    return key + '=' + encodeURIComponent(paramsObj[key])
  }).join('&')

  var uri = "https://coinspace.zendesk.com/requests/embedded/create/?" + params
  var corsUri = process.env.PROXY_URL + encodeURIComponent(uri)

  xhr({
    uri: corsUri
  }, function(err, resp, body) {
    if (resp.statusCode !== 201) {
      console.error(body)
      return callback(err)
    }
    callback(null)
  })
}

module.exports = sendRequest
