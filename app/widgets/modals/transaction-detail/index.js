'use strict';

const Ractive = require('widgets/modals/base');
const showConfirmAcceleration = require('widgets/modals/confirm-acceleration');
const { getWallet } = require('lib/wallet');
const { showInfo } = require('widgets/modals/flash');

module.exports = function(data) {
  let content;
  data.showAllInputs = false;
  data.inputsPerPage = 10;
  if (data.isNetwork('ethereum')) {
    data.isPendingFee = data.transaction.fee === -1;
    content = require('./contentEthereum.ract');
  } else if (data.isNetwork('ripple')) {
    content = require('./contentRipple.ract');
  } else if (data.isNetwork('stellar')) {
    content = require('./contentStellar.ract');
  } else if (data.isNetwork('eos')) {
    content = require('./contentEOS.ract');
  } else {
    content = require('./contentBtcBchLtc.ract');
  }

  const ractive = new Ractive({
    partials: {
      content,
    },
    data,
  });

  ractive.on('showMoreInputs', (context) => {
    context.original.preventDefault();
    ractive.set('showAllInputs', true);
  });

  ractive.on('accelerate', () => {
    const wallet = getWallet();
    let tx;
    try {
      tx = wallet.createReplacement(data.transaction);
    } catch (err) {
      return showInfo({ title: err.message });
    }
    showConfirmAcceleration({
      el: ractive.el,
      fadeInDuration: 0,
      tx,
    });
  });

  return ractive;
};

