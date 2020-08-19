'use strict';

function getToken() {
  let token = window.localStorage.getItem('_cs_token');

  try {
    token = JSON.parse(token);
  // eslint-disable-next-line no-empty
  } catch (e) {}

  return token;
}

function getTokenNetwork() {
  const token = getToken();
  if (!token) return false;
  if (typeof token === 'string') return token;
  return token.network;
}

function setToken(token) {
  window.localStorage.setItem('_cs_token', JSON.stringify(token));
}

module.exports = {
  getToken,
  getTokenNetwork,
  setToken,
};
