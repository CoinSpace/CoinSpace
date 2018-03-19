'use strict';

var CS = require('lib/wallet')
var Ractive = require('../auth')
var pinPage = require('../pin')
var showError = require('widgets/modals/flash').showError

function enterPassphrase(prevPage){
  var ractive = new Ractive({
    partials: {
      header: require('./header.ract'),
      content: require('./content.ract'),
      actions: require('./actions.ract'),
      footer: require('./footer.ract')
    }
  })

  ractive.on('back', function(){
    prevPage()
  })

  ractive.on('open-wallet-with-passphrase', function() {
    var passphrase = getPassphrase()

    if (passphrase !== '') {
      CS.createWallet(passphrase, ractive.getTokenNetwork(), onWalletCreated)
      ractive.set('opening', true)
      ractive.set('progress', 'Checking passphrase')
    }
  })

  ractive.observe('passphrase', function() {
    if(ractive.find('#passphraseField').value.length === 0) {
      ractive.set('passphraseEntered', false)
    } else {
      ractive.set('passphraseEntered', true)
    }
  })

  ractive.on('clearPassphrase', function(){
    var passfield = ractive.find('#passphraseField')
    ractive.set('passphrase', '')
    ractive.set('passphraseEntered', false)
    passfield.focus()
  })

  function getPassphrase() {
    return ractive.get('passphrase') ? ractive.get('passphrase').toString().toLowerCase().trim() : ''
  }

  function onWalletCreated(err, data) {
    ractive.set('opening', false)

    if(err) {
      return showError(err)
    }

    pinPage(enterPassphrase, data)
  }

  return ractive
}

module.exports = enterPassphrase
