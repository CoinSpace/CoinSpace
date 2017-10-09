'use strict';

var Ractive = require('lib/ractive');

module.exports = function(el) {
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
    }
  });

  return ractive;
}
