'use strict';

const Ractive = require('lib/ractive');

module.exports = function(el, options) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      id: options.id,
      filename: options.filename,
    },
  });

  ractive.on('clear', () => {
    ractive.find('input[type=file]').value = '';
    ractive.set('filename', '');
  });

  ractive.on('on-change', () => {
    const file = ractive.getFile();
    if (file) ractive.set('filename', file.name);
  });

  ractive.getFile = function() {
    const input = ractive.find('input[type=file]');
    return input.files[0];
  };

  return ractive;
};
