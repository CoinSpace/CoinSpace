'use strict';

var axios = require('axios');
var Authorization = 'Basic ' + Buffer.from(process.env.SHAPESHIFT_CLIENT_ID + ':' + process.env.SHAPESHIFT_CLIENT_SECRET).toString('base64');

function revokeToken(token) {
  return axios({
    method: 'post',
    url: 'https://auth.shapeshift.io/oauth/token/revoke',
    headers: {
      'Authorization': Authorization
    },
    data: {
      token: token
    }
  })
}

function getAccessToken(code) {
  return axios({
    method: 'post',
    url: 'https://auth.shapeshift.io/oauth/token',
    headers: {
      'Authorization': Authorization
    },
    data: {
      code: code,
      grant_type: 'authorization_code'
    }
  }).then(function(response) {
    var accessToken = response.data && response.data.access_token || '';
    return axios({
      method: 'get',
      url: 'https://auth.shapeshift.io/oauth/token/details',
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    }).then(function(response) {
      var isVerified = response.data && response.data.user.verificationStatus !== 'NONE';
      return isVerified ? accessToken : 'is_not_verified';
    });
  });
}

module.exports = {
  revokeToken: revokeToken,
  getAccessToken: getAccessToken
};
