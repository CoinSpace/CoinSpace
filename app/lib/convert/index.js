'use strict';

var Big = require('big.js')

var getNetwork = require('cs-network')
var networkName = getNetwork();

var unitMap = {
  bitcoin: '100000000',
  litecoin: '100000000',
  testnet: '100000000',
  ethereum: '1000000000000000000'
}

function toAtom(number) {
  if(number == undefined || number === '') return;
  if (networkName === 'ethereum') {
    return new Big(number).times(unitMap[networkName], 10).toFixed();
  } else {
    return parseInt(new Big(number).times(unitMap[networkName], 10).toFixed())
  }
}

function toUnit(number) {
  if(number == undefined || number === '') return;
  return parseFloat(new Big(number).div(unitMap[networkName]))
}

function toUnitString(number) {
  if(number == undefined || number === '') return;
  return new Big(number).div(unitMap[networkName]).toFixed()
}

function toFixedFloor(x, decimal){
  var factor = Math.pow(10, decimal)
  var y = parseInt(new Big(x).times(factor))
  return (y / factor).toFixed(decimal)
}

module.exports = {
  toAtom: toAtom,
  toUnit: toUnit,
  toUnitString: toUnitString,
  toFixedFloor: toFixedFloor
}
