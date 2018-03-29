'use strict';

// https://github.com/defunctzombie/qr.js/blob/515790fad4682b2d38008f229dbd814b0d2633e4/example/index.js
var qr = require('qr.js')
var emitter = require('lib/emitter')
var EthereumWallet = require('cs-ethereum-wallet');
var isValidIban = EthereumWallet.prototype.isValidIban;
var getAddressFromIban = EthereumWallet.prototype.getAddressFromIban;
var isScanAvailable = process.env.BUILD_TYPE === 'phonegap'

function encode(string, options) {
  options = options || {}
  var width = options.width || 200
  var height = options.height || 200

  var canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  var ctx = canvas.getContext('2d')

  var cells = qr(string).modules

  var tileW = width  / cells.length
  var tileH = height / cells.length

  for (var r = 0; r < cells.length ; ++r) {
      var row = cells[r]
      for (var c = 0; c < row.length ; ++c) {
          ctx.fillStyle = row[c] ? '#000' : '#fff'
          var w = (Math.ceil((c+1)*tileW) - Math.floor(c*tileW))
          var h = (Math.ceil((r+1)*tileH) - Math.floor(r*tileH))
          ctx.fillRect(Math.round(c*tileW), Math.round(r*tileH), w, h)
      }
  }

  return canvas
}

function scan(data) {
  if (!isScanAvailable) return false;

  cordova.plugins.barcodeScanner.scan(
    function(result) {
      if (result.text) {
        var address = result.text.split('?')[0].split(':').pop()

        if (isValidIban(address)) {
          address = getAddressFromIban(address);
        }

        emitter.emit('prefill-wallet', address, data.context)

        var match = result.text.match(/amount=([0-9.]+)/)
        if (match && match[1]) {
          emitter.emit('prefill-value', match[1], data.context)
        }
      }
    },
    function () {
      navigator.notification.alert(
        'Access to the camera has been prohibited; please enable it in the Settings app to continue',
        function(){},
        'Coin.Space'
      )
    },
    {
      showTorchButton: true
    }
  )
}

module.exports = {
  encode: encode,
  scan: scan,
  isScanAvailable: isScanAvailable
}

