'use strict';

const Ractive = require('widgets/modals/base');

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
    el: document.getElementById('transaction-detail'),
    partials: {
      content,
    },
    data,
  });

  ractive.on('showMoreInputs', (context) => {
    context.original.preventDefault();
    ractive.set('showAllInputs', true);
  });

  ractive.on('close', ()=> {
    ractive.fire('cancel');
  });

  return ractive;
};

