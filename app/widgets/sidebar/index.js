'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const initAccount = require('widgets/account-details');
const importPrivateKey = require('widgets/modals/import-private-key');
const exportPrivateKeys = require('widgets/modals/export-private-keys');
const CS = require('lib/wallet');
const showEosSetupAccount = require('widgets/modals/eos-setup-account');

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      isEnabledImport: true,
      isEnabledExport: true,
      isEOS: false,
      isPhonegap: process.env.BUILD_TYPE === 'phonegap',
    },
  });

  initAccount(ractive.find('#account-details'));

  ractive.on('logout', function(context) {
    context.original.preventDefault();
    CS.reset();
    location.reload();
  });

  ractive.on('about', function() {
    emitter.emit('toggle-menu', false);
    emitter.emit('toggle-terms', true);
  });

  ractive.on('show-zendesk', function(context) {
    context.original.preventDefault();
    window.Zendesk.showHelpCenter();
  });

  ractive.on('import-private-key', function() {
    importPrivateKey();
  });

  ractive.on('export-private-keys', function() {
    exportPrivateKeys();
  });

  ractive.on('eos-setup-account', showEosSetupAccount);

  emitter.on('wallet-ready', function() {
    const wallet = CS.getWallet();
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
    const classes = ractive.el.classList;
    if (open) {
      classes.add('open');
    } else {
      classes.add('animating');
      classes.remove('open');
      setTimeout(() => {
        classes.remove('animating');
      }, 300);
    }
  });

  return ractive;
};
