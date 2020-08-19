'use strict';

const bchaddr = require('bchaddrjs');

function parseBtcLtcTx(tx, networkName) {
  return {
    id: tx.txId,
    amount: tx.amount,
    timestamp: tx.timestamp * 1000,
    confirmations: tx.confirmations,
    fee: tx.fees,
    ins: tx.vin.map((input) => {
      return {
        address: toAddress(networkName, input.addr),
        amount: input.valueSat,
      };
    }),
    outs: tx.vout.map((output) => {
      return {
        address: toAddress(networkName, output.scriptPubKey.addresses ? output.scriptPubKey.addresses[0] : null),
        amount: output.valueSat,
      };
    }),
  };
}

function toAddress(networkName, address) {
  if (networkName !== 'bitcoincash') return address;
  try {
    address = bchaddr.toCashAddress(address).split(':')[1];
  // eslint-disable-next-line
  } catch (e) {};
  return address;
}

function parseEthereumTx(tx) {
  return {
    id: tx.token ? tx.txId : tx._id,
    amount: tx.value,
    timestamp: tx.timestamp * 1000,
    confirmations: tx.confirmations,
    fee: tx.fee,
    status: tx.status,
    from: tx.from,
    to: tx.to,
    token: tx.token,
  };
}

module.exports = {
  parseBtcLtcTx,
  parseEthereumTx,
};
