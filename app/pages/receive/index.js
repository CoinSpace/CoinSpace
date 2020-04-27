'use strict';

var Ractive = require('lib/ractive')
var emitter = require('lib/emitter')
var CS = require('lib/wallet')
var showTooltip = require('widgets/modals/tooltip')
var showQr = require('widgets/modals/qr')
var geo = require('lib/geo')
var showError = require('widgets/modals/flash').showError
var showSetDetails = require('widgets/modals/set-details')
var getTokenNetwork = require('lib/token').getTokenNetwork;
var qrcode = require('lib/qrcode')
var initEosSetup = require('widgets/eos/setup');

module.exports = function(el){
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      address: '',
      qrVisible: false,
      btn_message: 'Turn Mecto on',
      connecting: false,
      broadcasting: false,
      isPhonegap: process.env.BUILD_TYPE === 'phonegap'
    }
  })

  initEosSetup(ractive.find('#eos-setup'));

  emitter.on('wallet-ready', function() {
    var wallet = CS.getWallet();
    ractive.set('needToSetupEos', wallet.networkName === 'eos' && !wallet.isActive);
    ractive.set('address', getAddress());
    showQRcode();
  })

  emitter.on('tx-sent', function() {
    ractive.set('address', getAddress());
    showQRcode();
  });

  ractive.on('toggle-broadcast', function() {
    if (ractive.get('connecting')) return;

    if (ractive.get('broadcasting')) {
      mectoOff()
    } else {
      showSetDetails(function(err) {
        if (err) {
          return showError({message: 'Could not save your details'})
        }
        mectoOn()
      })
    }
  })

  function showQRcode(){
    if (ractive.get('isPhonegap')) {
      var canvas = document.getElementById('qr_canvas');
      while (canvas.hasChildNodes()) {
        canvas.removeChild(canvas.firstChild);
      }
      var qr = qrcode.encode(getTokenNetwork() + ':' + getAddress());
      canvas.appendChild(qr);
    }
  }

  function mectoOff(){
    ractive.set('broadcasting', false)
    ractive.set('btn_message', 'Turn Mecto on')
    geo.remove()
  }

  function mectoOn(){
    ractive.set('connecting', true)
    ractive.set('btn_message', 'Checking your location')
    geo.save(function(err) {
      if (err) {
        return handleMectoError(err)
      }
      ractive.set('connecting', false)
      ractive.set('broadcasting', true)
      ractive.set('btn_message', 'Turn Mecto off')
    })
  }

  ractive.on('show-qr', function(){
    if(ractive.get('isPhonegap')){
      window.plugins.socialsharing.shareWithOptions({
        message: ractive.get('address')
      });
    } else {
      showQr({
        address: ractive.get('address')
      })
    }
  })

  ractive.on('help-mecto', function() {
    showTooltip({
      message: 'Mecto lets you broadcast your wallet address to other nearby Coin users by comparing GPS data. This data is deleted once you turn Mecto off.'
    })
  })

  function getAddress() {
    return CS.getWallet().getNextAddress();
  }

  function handleMectoError(err) {
    showError({
      message: err.message
    })
    ractive.set('connecting', false)
    ractive.set('broadcasting', false)
    ractive.set('btn_message', 'Turn Mecto on')
  }

  return ractive
}
