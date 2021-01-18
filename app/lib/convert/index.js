'use strict';

const Big = require('big.js');

let factor;

function toAtom(number) {
  if (!number) return '0';
  return Big(number).times(factor).toFixed();
}

function toUnit(number) {
  if (!number) return Big(0);
  return Big(number).div(factor);
}

function toUnitString(number, d) {
  if (!number) return '0';
  if (!d) return Big(number).div(factor).toFixed();
  return Big(number).div(Big(10).pow(d)).toFixed();
}

function setDecimals(decimals) {
  factor = Big(10).pow(decimals);
}

function cryptoToFiat(amount, exchangeRate) {
  if (amount == undefined || exchangeRate == undefined) return '⚠️';
  const rate = Big(exchangeRate);
  const value = Big(amount).times(rate);
  if (value.gt(1.0)) {
    return value.toFixed(2);
  } else {
    const decimals = rate.toFixed().includes('.') ? rate.toFixed().split('.')[1].length : 2;
    return value.toFixed(decimals > 2 ? decimals : 2)
  }
}

module.exports = {
  toAtom,
  toUnit,
  toUnitString,
  setDecimals,
  cryptoToFiat,
};
