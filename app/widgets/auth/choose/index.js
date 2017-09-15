'use strict';

var Ractive = require('../auth')
var passphrasePage = require('../passphrase')
var createIntroPage = require('../create-intro')

module.exports = function choose(){
  var ractive = new Ractive({
    partials: {
      actions: require('./actions.ract'),
      footer: require('./footer.ract')
    },
    data: {
      isPhonegap: process.env.BUILD_TYPE === 'phonegap'
    }
  })

  ractive.on('create-new-wallet', function(){
    createIntroPage(choose)
  })

  ractive.on('reveal-passphrase-input', function(){
    passphrasePage(choose)
  })

  return ractive
}

