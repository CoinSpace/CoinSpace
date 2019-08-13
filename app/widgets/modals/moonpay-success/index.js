'use strict';

var Ractive = require('widgets/modals/base');

function open() {
  var ractive = new Ractive({
    partials: {
      content: require('./_content.ract'),
    },
  });
  return ractive;
}

module.exports = open
