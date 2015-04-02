'use strict';

var Ractive = require('cs-modal')

module.exports = function showTooltip(data){

  if (window.buildType === 'phonegap') {
    data.link = false
  }

  var ractive = new Ractive({
    el: document.getElementById('tooltip'),
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

