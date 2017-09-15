'use strict';

var Ractive = require('widgets/modal')

module.exports = function showTooltip(data){

  if (process.env.BUILD_TYPE === 'phonegap') {
    data.link = false
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

