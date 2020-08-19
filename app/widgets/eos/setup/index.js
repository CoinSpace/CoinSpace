'use strict';

const Ractive = require('lib/ractive');
const showEosSetupAccount = require('widgets/modals/eos-setup-account');

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
  });

  ractive.on('setup', showEosSetupAccount);

  return ractive;
};
