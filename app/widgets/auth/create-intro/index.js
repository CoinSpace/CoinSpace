'use strict';

var Ractive = require('../auth')
var CS = require('lib/wallet')
var confirmPassphrasePage = require('../create-confirm')
var showError = require('widgets/modals/flash').showError

module.exports = function(prevPage){
  var ractive = new Ractive({
    partials: {
      header: require('./header.ract'),
      actions: require('./actions.ract'),
      footer: require('./footer.ract')
    }
  })

  ractive.on('back', function(){
    prevPage()
  })

  ractive.on('generate-phrase', function(){
    ractive.set('opening', true)
    ractive.set('progress', 'Generating')
    CS.createWallet(null, this.getTokenNetwork(), function(err, data){
      if(err) return showError(err);
      confirmPassphrasePage(data)
    })
  })

  return ractive
}

