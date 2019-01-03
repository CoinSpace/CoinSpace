'use strict';

var Ractive = require('lib/ractive');
var showEosSetupAccount = require('widgets/modals/eos-setup-account');

module.exports = function(el) {
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract')
  });

  ractive.on('setup', showEosSetupAccount);

  return ractive;
}
