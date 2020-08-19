'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {},
  });

  ractive.on('back', (context) => {
    context.original.preventDefault();
    emitter.emit('toggle-terms', false);
    emitter.emit('toggle-menu', true);
  });

  emitter.on('toggle-terms', (open) => {
    ractive.el.classList.add('terms-open');
    if (open) {
      ractive.el.classList.remove('closed');
    } else {
      ractive.el.classList.add('closed');
      ractive.el.classList.remove('terms-open');
    }
  });

  return ractive;
};
