'use strict';

var Ractive = require('widgets/modals/base');

module.exports = function(data) {
  var content;
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

  var ractive = new Ractive({
    el: document.getElementById('transaction-detail'),
    partials: {
      content: content
    },
    data: data
  });

  ractive.on('showMoreInputs', function(context) {
    context.original.preventDefault();
    ractive.set('showAllInputs', true);
  });

  ractive.on('close', function(){
    ractive.fire('cancel')
  });

  return ractive;
}

