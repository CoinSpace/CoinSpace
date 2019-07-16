'use strict';

var Ractive = require('../auth')
var _ = require('lodash');
var createPassphraseConfirmPage = require('../create-passphrase-confirm')
var Clipboard = require('clipboard')
function confirm(data) {
  var ractive = new Ractive({
    partials: {
      header: require('./header.ract'),
      actions: require('./actions.ract')
    },
    data: {
      passphrase: data.mnemonic,
      isCopied: false,
      isClipboardEnabled: Clipboard.isSupported(),
      checked: false,
      termsChecked: false
    }
  })

  var clipboard = new Clipboard(ractive.find('#js-passphrase'));
  clipboard.on('success', function() {
      ractive.set('isCopied', true);
      setTimeout(function() {
        ractive.set('isCopied', false);
      }, 1000)
  });

  ractive.on('toggle-check', function() {
    ractive.set('checked', !ractive.get('checked'));
  })

  ractive.on('toggle-terms-check', function() {
    ractive.set('termsChecked', !ractive.get('termsChecked'));
  })

  ractive.on('confirm', function() {
    data.randomIndexes = _.shuffle(_.range(12));
    createPassphraseConfirmPage(confirm, data)
  })

  return ractive
}

module.exports = confirm
