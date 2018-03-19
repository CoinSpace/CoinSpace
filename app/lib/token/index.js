'use strict';

function getToken() {
  var token = window.localStorage.getItem('_cs_token');

  try {
    token = JSON.parse(token);
  } catch (e) {}

  return token;
}

function getTokenNetwork() {
  var token = getToken();
  if (!token) return false;
  if (typeof token === 'string') return token;
  return token.network;
}

function setToken(token) {
  window.localStorage.setItem('_cs_token', JSON.stringify(token));
}

module.exports = {
  getToken: getToken,
  getTokenNetwork: getTokenNetwork,
  setToken: setToken
}
