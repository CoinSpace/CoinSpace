'use strict';

var Ractive = require('lib/ractive');

module.exports = function(el, options) {
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      id: options.id,
      filename: options.filename
    },
  });

  ractive.on('clear', function() {
    ractive.find('input[type=file]').value = '';
    ractive.set('filename', '');
  });

  ractive.on('on-change', function() {
    var file = ractive.getFile();
    if (file) ractive.set('filename', file.name);
  });

  ractive.getFile = function() {
    var input = ractive.find('input[type=file]');
    return input.files[0];
  };

  return ractive;
}
