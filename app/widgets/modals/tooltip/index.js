'use strict';

var Ractive = require('widgets/modals/base')

module.exports = function showTooltip(data){

  if (process.env.BUILD_TYPE === 'phonegap') {
    data.bottomLink = false
  }

  var ractive = new Ractive({
    el: document.getElementById('tooltip'),
    partials: {
      content: require('./content.ract'),
    },
    data: data
  })

  ractive.on('close', function(){
    ractive.fire('cancel')
  })

  return ractive
}

