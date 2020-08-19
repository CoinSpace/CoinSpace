'use strict';

const Ractive = require('widgets/modals/base');

function open(name, remove) {

  const ractive = new Ractive({
    partials: {
      content: require('./_content.ract'),
    },
    data: {
      removing: false,
      name,
    },
  });

  ractive.on('remove', function() {
    ractive.set('removing', true);
    remove(this);
  });

  return ractive;
}

module.exports = open;
