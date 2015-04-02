'use strict';

var Ractive = require('../auth')
var pinPage = require('../pin')
var animateCheckbox = require('cs-transitions/highlight.js')
function confirm(data){
  var ractive = new Ractive({
    partials: {
      header: require('./header.ract').template,
      actions: require('./actions.ract').template
    },
    data: {
      passphrase: data.mnemonic
    }
  })

  ractive.on('toggle-check', function(){
    if(ractive.get('checked')) {
      ractive.set('checked', false)
    } else {
      ractive.set('checked', true)
    }
  })

  ractive.on('toggle-phone-check', function(){
    if(ractive.get('phoneChecked')) {
      ractive.set('phoneChecked', false)
    } else {
      ractive.set('phoneChecked', true)
    }
  })

  ractive.on('create-pin', function() {
    if(!ractive.get('checked')) return animateCheckbox(ractive.nodes.check);

    if(ractive.get('phoneChecked')) {
      data.phone = (ractive.get('phone') || '').toString().replace(/[^0-9]/g, '')
    }

    pinPage(confirm, data)
    ractive.teardown()
  })

  return ractive
}

module.exports = confirm
