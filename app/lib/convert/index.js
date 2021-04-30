import Big from 'big.js';

const state = {};

export function toAtom(unit) {
  if (!unit) return '0';
  return Big(unit).times(state.factor).toFixed(0);
}

export function toUnitString(atom, decimals) {
  if (!atom) return '0';
  if (!decimals) return Big(atom).div(state.factor).toFixed();
  // strip leading zeros
  return Big(atom).div(Big(10).pow(decimals)).toFixed();
}

function setDecimals(decimals) {
  state.decimals = decimals;
  state.factor = Big(10).pow(decimals);
}

export function cryptoToFiat(unit, exchangeRate) {
  if (unit == undefined || exchangeRate == undefined) return;
  const rate = Big(exchangeRate);
  const value = Big(unit).times(rate);
  let decimals = 2;
  if (value.lte(1.0) && rate.toFixed().includes('.')) {
    const rateDecimals = rate.toFixed().split('.')[1].length;
    decimals = rateDecimals > 2 ? rateDecimals : 2;
  }
  // strip leading zeros
  return Big(value.toFixed(decimals)).toFixed();
}

export function fiatToCrypto(value, exchangeRate) {
  if (value == undefined || exchangeRate == undefined) return;
  const rate = Big(exchangeRate);
  const unit = Big(value).div(rate).toFixed(state.decimals);
  // strip leading zeros
  return Big(unit).toFixed();
}

export function toDecimalString(value) {
  return toUnitString(toAtom(value));
}

export default {
  toAtom,
  toUnitString,
  setDecimals,
  cryptoToFiat,
  fiatToCrypto,
  toDecimalString,
};
