'use strict';

const Ractive = require('widgets/modals/base');

function open({ confirmUpdate }) {
  const ractive = new Ractive({
    append: true,
    partials: {
      content: require('./content.ract'),
    },
    data: {},
  });

  ractive.on('skip', () => {
    ractive.fire('close');
  });

  ractive.on('confirm', confirmUpdate);

  return ractive;
}

module.exports = open;
