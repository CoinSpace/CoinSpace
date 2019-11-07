'use strict';

var Ractive = require('widgets/modals/base');

function open(name, remove) {

  var ractive = new Ractive({
    partials: {
      content: require('./_content.ract')
    },
    data: {
      removing: false,
      name: name
    }
  });

  ractive.on('remove', function() {
    remove(this);
  });

  return ractive;
}

module.exports = open
