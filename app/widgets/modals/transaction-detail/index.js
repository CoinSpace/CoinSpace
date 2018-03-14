'use strict';

var Ractive = require('widgets/modals/base')

module.exports = function(data) {
  var content = null;
  if (data.isEthereum) {
    data.isPendingFee = data.transaction.fee === -1;
    content = require('./contentEthereum.ract')
  } else {
    content = require('./contentBtcBchLtc.ract')
  }

  var ractive = new Ractive({
    el: document.getElementById('transaction-detail'),
    partials: {
      content: content
    },
    data: data
  })

  ractive.on('close', function(){
    ractive.fire('cancel')
  })

  return ractive
}

