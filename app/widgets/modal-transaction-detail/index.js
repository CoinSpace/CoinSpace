'use strict';

var Ractive = require('cs-modal')

module.exports = function showTooltip(data){

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

