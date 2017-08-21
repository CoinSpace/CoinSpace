'use strict';

var CS = require('cs-wallet-js')
var Ractive = require('../auth')
var pinPage = require('../pin')
var showError = require('cs-modal-flash').showError

function enterPassphrase(prevPage){
  var ractive = new Ractive({
    partials: {
      header: require('./header.ract').template,
      content: require('./content.ract').template,
      actions: require('./actions.ract').template,
      footer: require('./footer.ract').template
    }
  })

  ractive.on('back', function(){
    prevPage()
    ractive.teardown()
  })

  ractive.on('open-wallet-with-passphrase', function() {
    var passphrase = getPassphrase()

    if (passphrase !== '') {
      CS.createWallet(passphrase, ractive.getNetwork(), onWalletCreated)
      ractive.set('opening', true)
      ractive.set('progress', 'Checking passphrase')
    }
  })

  ractive.observe('passphrase', function() {
    if(ractive.nodes.passphraseField.value.length === 0) {
      ractive.set('passphraseEntered', false)
    } else {
      ractive.set('passphraseEntered', true)
    }
  })

  ractive.on('clearPassphrase', function(){
    var passfield = ractive.nodes.passphraseField
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
    ractive.teardown()
  }

  return ractive
}

module.exports = enterPassphrase
