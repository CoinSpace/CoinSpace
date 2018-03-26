'use strict';

var Big = require('big.js')

var decimals;
var factor;

function toAtom(number) {
  if (!number) return '0';
  return new Big(number).times(factor).toFixed();
}

function toUnit(number) {
  if (!number) return new Big(0);
  return new Big(number).div(factor)
}

function toUnitString(number, d) {
  if (!number) return '0';
  if (!d) return new Big(number).div(factor).toFixed();
  return new Big(number).div(new Big(10).pow(d)).toFixed();
}

function setDecimals(d) {
  decimals = d;
  factor = new Big(10).pow(decimals);
}

module.exports = {
  toAtom: toAtom,
  toUnit: toUnit,
  toUnitString: toUnitString,
  setDecimals: setDecimals
}
