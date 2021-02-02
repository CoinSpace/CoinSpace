'use strict';

const Big = require('big.js');

const state = {};

function toAtom(unit) {
  if (!unit) return '0';
  return Big(unit).times(state.factor).toFixed(0);
}

function toUnitString(atom, decimals) {
  if (!atom) return '0';
  if (!decimals) return Big(atom).div(state.factor).toFixed();
  // strip leading zeros
  return Big(atom).div(Big(10).pow(decimals)).toFixed();
}

function setDecimals(decimals) {
  state.decimals = decimals;
  state.factor = Big(10).pow(decimals);
}

function cryptoToFiat(unit, exchangeRate) {
  if (unit == undefined || exchangeRate == undefined) return;
  const rate = Big(exchangeRate);
  const value = Big(unit).times(rate);
  if (value.gt(1.0)) {
    return value.toFixed(2);
  } else {
    const decimals = rate.toFixed().includes('.') ? rate.toFixed().split('.')[1].length : 2;
    return value.toFixed(decimals > 2 ? decimals : 2);
  }
}

function fiatToCrypto(value, exchangeRate) {
  if (value == undefined || exchangeRate == undefined) return;
  const rate = Big(exchangeRate);
  const unit = Big(value).div(rate).toFixed(state.decimals);
  // strip leading zeros
  return Big(unit).toFixed();
}

function toDecimalString(value) {
  return toUnitString(toAtom(value));
}

module.exports = {
  toAtom,
  toUnitString,
  setDecimals,
  cryptoToFiat,
  fiatToCrypto,
  toDecimalString,
};
