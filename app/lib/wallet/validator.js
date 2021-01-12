'use strict';

const { toAtom, toUnitString } = require('lib/convert');

function validateSend(options) {
  const amount = toAtom(options.amount);
  const { wallet } = options;
  const { to } = options;
  const fee = toAtom(options.fee);
  let tx = null;
  let message;

  try {
    if (['bitcoin', 'bitcoincash', 'bitcoinsv', 'litecoin', 'dogecoin', 'dash'].indexOf(wallet.networkName) !== -1) {
      tx = wallet.createTx(to, amount, fee);
    } else if (wallet.networkName === 'ethereum') {
      tx = wallet.createTx(to, amount);
    } else if (wallet.networkName === 'ripple') {
      tx = wallet.createTx(to, amount, options.tag, options.invoiceId, !options.destinationInfo.isActive);
    } else if (wallet.networkName === 'stellar') {
      tx = wallet.createTx(to, amount, options.memo, !options.destinationInfo.isActive);
    } else if (wallet.networkName === 'eos') {
      tx = wallet.createTx(to, amount, options.memo);
    }
    options.tx = tx;
  } catch (e) {
    let error;
    if (/Invalid address/.test(e.message)) {
      throw new Error('Please enter a valid address to send to');
    } else if (/Invalid tag/.test(e.message)) {
      throw new Error('Please enter a valid destination tag');
    } else if (/Invalid invoiceID/.test(e.message)) {
      throw new Error('Please enter a valid invoice ID');
    } else if (/Invalid memo/.test(e.message)) {
      throw new Error('Please enter a valid memo');
    } else if (/Inactive account/.test(e.message)) {
      // eslint-disable-next-line max-len
      error = new Error("Your wallet isn't activated. To activate it please send greater than minimum reserve (:minReserve :denomination) to your wallet address.");
      error.interpolations = { minReserve: wallet.minReserve, denomination: wallet.denomination };
      throw error;
    } else if (/Destination address equal source address/.test(e.message)) {
      throw new Error('Please enter an address other than your wallet address');
    } else if (/Invalid value/.test(e.message)) {
      if (/Less than minimum reserve/.test(e.details)) {
        // eslint-disable-next-line max-len
        error = new Error("Recipient's wallet isn't activated. You can send only amount greater than :minReserve :denomination.");
        error.interpolations = { minReserve: wallet.minReserve, denomination: wallet.denomination };
      } else {
        error = new Error('Please enter an amount above');
        error.interpolations = { dust: toUnitString(e.dustThreshold) };
      }
      throw error;
    } else if (/Invalid gasLimit/.test(e.message)) {
      throw new Error('Please enter Gas Limit greater than zero');
    } else if (/Transaction too large/.test(e.message)) {
      throw new Error('Transaction too large');
    } else if (/Insufficient funds/.test(e.message)) {
      if (/Additional funds confirmation pending/.test(e.details)) {
        // eslint-disable-next-line max-len
        throw new Error('Some funds are temporarily unavailable. To send this transaction, you will need to wait for your pending transactions to be confirmed first.');
      } else if (/Attempt to empty wallet/.test(e.details) && wallet.networkName === 'ethereum') {
        message = [
          'It seems like you are trying to empty your wallet',
          'Taking transaction fee into account, we estimated that the max amount you can send is',
          'We have amended the value in the amount field for you',
        ].join('. ');
        error = new Error(message);
        error.interpolations = { sendableBalance: toUnitString(e.sendableBalance) };
        throw error;
      } else if (/Attempt to empty wallet/.test(e.details) && wallet.networkName === 'eos') {
        message = [
          'It seems like you are trying to empty your wallet',
          'Max amount you can send is',
          'We have amended the value in the amount field for you',
        ].join('. ');
        error = new Error(message);
        error.interpolations = { sendableBalance: toUnitString(e.sendableBalance) };
        throw error;
      // eslint-disable-next-line max-len
      } else if (/Attempt to empty wallet/.test(e.details) && (wallet.networkName === 'ripple' || wallet.networkName === 'stellar')) {
        message = [
          'It seems like you are trying to empty your wallet',
          'Taking transaction fee and minimum reserve into account, we estimated that the max amount you can send is',
          'We have amended the value in the amount field for you',
        ].join('. ');
        error = new Error(message);
        error.interpolations = {
          sendableBalance: toUnitString(e.sendableBalance),
          minReserve: wallet.minReserve,
          denomination: wallet.denomination,
        };
        throw error;
      } else {
        throw new Error('You do not have enough funds in your wallet (incl. fee)');
      }
    } else if (/Insufficient ethereum funds for token transaction/.test(e.message)) {
      error = new Error('You do not have enough Ethereum funds to pay transaction fee (:ethereumRequired ETH).');
      error.interpolations = { ethereumRequired: toUnitString(e.ethereumRequired, 18) };
      throw error;
    }

    throw e;
  }
}

module.exports = validateSend;
