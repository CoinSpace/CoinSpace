'use strict';

var Ractive = require('widgets/modals/base')
var translate = require('lib/i18n').translate
var qrcode = require('lib/qrcode')
var getTokenNetwork = require('lib/token').getTokenNetwork;

module.exports = function showTooltip(data){
  data.mailto = mailto
  data.title = data.title || translate('Your wallet address')
  var ractive = new Ractive({
    el: document.getElementById('tooltip'),
    partials: {
      content: require('./content.ract'),
    },
    data: data
  })

  var canvas = ractive.find('#qr-canvas')
  var name = data.name || getTokenNetwork();
  var qr = qrcode.encode(name + ':' + data.address)
  canvas.appendChild(qr)

  ractive.on('close', function(){
    ractive.fire('cancel')
  })

  function mailto(){
    return 'mailto:?body='+data.address+'%0A%0ASent%20from%20Coin%20Space%20Wallet%0Ahttps%3A%2F%2Fcoin.space'
  }

  return ractive
}

