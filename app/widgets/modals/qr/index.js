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

  function mailto() {
    return 'mailto:?body=' + encodeURIComponent(data.address + '\n\nSent from Coin Wallet\nhttps://coin.space')
  }

  return ractive
}

