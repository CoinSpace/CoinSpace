'use strict';

var Ractive = require('cs-modal')

module.exports = function showTooltip(data){

  var content = null;
  if (data.isEthereum) {
    data.isPendingFee = data.transaction.fee === -1;
    content = require('./contentEthereum.ract').template
  } else {
    content = require('./contentBtcLtc.ract').template
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

