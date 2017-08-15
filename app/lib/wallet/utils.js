'use strict';

function parseBtcLtcTx(tx) {
  return {
    id: tx.txId,
    amount: tx.amount,
    timestamp: tx.timestamp * 1000,
    confirmations: tx.confirmations,
    fee: tx.fees,
    ins: tx.vin.map(function(input) {
      return {
        address: input.addr,
        amount: input.valueSat
      }
    }),
    outs: tx.vout.map(function(output) {
      return {
        address: output.scriptPubKey.addresses[0],
        amount: output.valueSat
      }
    })
  }
}

function parseEthereumTx(tx) {
  return {
    id: tx._id,
    amount: tx.value,
    timestamp: tx.timestamp * 1000,
    confirmations: tx.confirmations,
    fee: tx.fee,
    from: tx.from,
    to: tx.to
  }
}

module.exports = {
  parseBtcLtcTx: parseBtcLtcTx,
  parseEthereumTx: parseEthereumTx
}
