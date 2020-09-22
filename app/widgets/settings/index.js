'use strict';

const Ractive = require('lib/ractive');
const LS = require('lib/wallet/localStorage');
const Avatar = require('lib/avatar');
const emitter = require('lib/emitter');
const CS = require('lib/wallet');
const importPrivateKey = require('widgets/modals/import-private-key');
const exportPrivateKeys = require('widgets/modals/export-private-keys');
const showEosSetupAccount = require('widgets/modals/eos-setup-account');

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      avatar: `url('${Avatar.getAvatarByIndex(3)}')`,
      isEnabledImport: true,
      isEnabledExport: true,
      isEOS: false,
    },
  });

  emitter.on('wallet-ready', () => {
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

  ractive.on('import-private-key', importPrivateKey);
  ractive.on('export-private-keys', exportPrivateKeys);
  ractive.on('eos-setup-account', showEosSetupAccount);

  ractive.on('support', () => {
    if (process.env.BUILD_TYPE === 'phonegap') {
      window.Zendesk.showHelpCenter();
    } else {
      window.open('https://coinapp.zendesk.com/hc/en-us/sections/115000511287-FAQ', '_blank');
    }
  });

  ractive.on('logout', () => {
    LS.reset();
    location.reload();
  });

  return ractive;
};
