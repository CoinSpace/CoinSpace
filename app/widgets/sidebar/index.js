'use strict';

var Ractive = require('lib/ractive');
var emitter = require('lib/emitter');
var initAccount = require('widgets/account-details');
var importPrivateKey = require('widgets/modals/import-private-key');
var exportPrivateKeys = require('widgets/modals/export-private-keys');
var CS = require('lib/wallet');
var shapeshift = require('lib/shapeshift');
var showEosSetupAccount = require('widgets/modals/eos-setup-account');

module.exports = function(el) {
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      isEnabledImport: true,
      isEnabledExport: true,
      isEOS: false
    }
  });

  initAccount(ractive.find('#account-details'));

  ractive.on('logout', function(context) {
    context.original.preventDefault();
    CS.reset();
    CS.resetPin();
    shapeshift.cleanAccessToken();
    location.reload();
  });

  ractive.on('about', function() {
    emitter.emit('toggle-menu', false);
    emitter.emit('toggle-terms', true);
  });

  ractive.on('import-private-key', function() {
    importPrivateKey();
  });

  ractive.on('export-private-keys', function() {
    exportPrivateKeys();
  });

  ractive.on('eos-setup-account', showEosSetupAccount);

  emitter.on('wallet-ready', function() {
    var wallet = CS.getWallet();
    ractive.set('isEOS', wallet.networkName === 'eos');
    if (wallet.networkName === 'ethereum' && wallet.token) {
      ractive.set('isEnabledImport', false);
      ractive.set('isEnabledExport', false);
    } else if (wallet.networkName === 'eos') {
      ractive.set('isEnabledImport', false);
      ractive.set('isEnabledExport', true);
    } else {
      ractive.set('isEnabledImport', true);
      ractive.set('isEnabledExport', true);
    }
  });

  emitter.on('toggle-menu', function(open) {
    var classes = ractive.el.classList;
    if (open) {
      classes.add('open');
    } else {
      classes.add('animating');
      classes.remove('open');
      setTimeout(function(){
        classes.remove('animating');
      }, 300);
    }
  });

  return ractive;
}
