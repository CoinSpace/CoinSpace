'use strict';

var Ractive = require('widgets/modals/base');
var ractive;

function open(tx) {
  ractive = new Ractive({
    partials: {
      content: require('./content.ract')
    },
    data: {
      tx: tx
    }
  });

  ractive.on('close', function() {
    ractive.fire('cancel');
  });

  return ractive;
}

module.exports = open;
