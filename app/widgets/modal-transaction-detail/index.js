'use strict';

var Ractive = require('cs-modal')
var getNetwork = require('cs-network')

module.exports = function showTooltip(data){

  data.isBitcoin = getNetwork() === 'bitcoin'
  data.isLitecoin = getNetwork() === 'litecoin'

  var ractive = new Ractive({
    el: document.getElementById('transaction-detail'),
    partials: {
      content: require('./content.ract').template,
    },
    data: data
  })

  ractive.on('close', function(){
    ractive.fire('cancel')
  })

  return ractive
}

