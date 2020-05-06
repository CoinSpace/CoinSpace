'use strict';

var Ractive = require('../auth')
var CS = require('lib/wallet')
var createPassphrasePage = require('../create-passphrase')
var showError = require('widgets/modals/flash').showError

module.exports = function createIntro(prevPage) {
  var ractive = new Ractive({
    partials: {
      header: require('./header.ract'),
      actions: require('./actions.ract'),
      footer: require('./footer.ract')
    }
  })

  ractive.on('back', function(){
    if (prevPage) prevPage();
  })

  ractive.on('generate-phrase', function(){
    ractive.set('opening', true)
    ractive.set('progress', 'Generating')
    CS.createWallet(null, this.getTokenNetwork(), function(err, data) {
      if(err) return showError(err);
      createPassphrasePage(function() {
        createIntro(prevPage);
      }, data);
    })
  })

  return ractive
}

