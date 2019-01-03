'use strict';

var Ractive = require('widgets/modals/base');
var getWallet = require('lib/wallet').getWallet;
var sync = require('lib/wallet').sync;
var db = require('lib/db');
var showError = require('widgets/modals/flash').showError;
var emitter = require('lib/emitter');

function open() {
  var ractive = new Ractive({
    partials: {
      content: require('./_content.ract')
    },
    data: {
      isLoading: false,
      success: false,
      accountName: '',
      showInstruction: false,
      price: '',
      memo: '',
      isPhonegap: process.env.BUILD_TYPE === 'phonegap'
    }
  });

  ractive.on('confirm', function() {
    ractive.set('isLoading', true);
    var wallet = getWallet();
    var accountName = ractive.get('accountName').trim();
    wallet.setupAccount(accountName).then(function(result) {
      ractive.set('isLoading', false);
      if (result.needToCreateAccount) {
        ractive.set('showInstruction', true);
        ractive.set('price', result.price + ' EOS');
        ractive.set('memo', result.memo);
      } else {
        db.set('eosAccountName', accountName).then(function() {
          ractive.set('success', true);
          syncWallet();
        })
      }
    }).catch(function(err) {
      ractive.set('isLoading', false);
      if (/Invalid account name/.test(err.message)) {
        return showError({message: 'Invalid account name'});
      } else if (/Account name is already taken/.test(err.message)) {
        return showError({message: 'This account name is already taken, please choose another one.'});
      }
      console.error(err.message);
      return showError({message: err.message});
    });
  });

  function syncWallet() {
    emitter.emit('sync');
    setTimeout(function() {
      sync(onSyncDone, onTxSyncDone);
    }, 200);
    function onSyncDone(err) {
      if (err) {
        console.error(err);
        return showError({message: err.message});
      }
      emitter.emit('wallet-ready');
    }
    function onTxSyncDone(err, transactions) {
      if (err) {
        emitter.emit('set-transactions', []);
        console.error(err);
        return showError({message: err.message});
      }
      emitter.emit('set-transactions', transactions);
    }
  }

  ractive.on('clearAccountName', function() {
    var input = ractive.find('#account_name');
    ractive.set('accountName', '');
    input.focus();
  });

  ractive.on('share-memo', function() {
    window.plugins.socialsharing.shareWithOptions({
      message: ractive.get('address')
    });
  });

  ractive.on('back', function() {
    ractive.set('showInstruction', false);
  });

  return ractive;
}

module.exports = open
