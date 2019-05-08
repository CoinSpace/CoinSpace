'use strict';

var Big = require('big.js')

var decimals;
var factor;

function toAtom(number) {
  if (!number) return '0';
  return Big(number).times(factor).toFixed();
}

function toUnit(number) {
  if (!number) return Big(0);
  return Big(number).div(factor)
}

function toUnitString(number, d) {
  if (!number) return '0';
  if (!d) return Big(number).div(factor).toFixed();
  return Big(number).div(Big(10).pow(d)).toFixed();
}

function setDecimals(d) {
  decimals = d;
  factor = Big(10).pow(decimals);
}

module.exports = {
  toAtom: toAtom,
  toUnit: toUnit,
  toUnitString: toUnitString,
  setDecimals: setDecimals
}
