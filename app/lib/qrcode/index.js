'use strict';

// https://github.com/defunctzombie/qr.js/blob/515790fad4682b2d38008f229dbd814b0d2633e4/example/index.js
var qr = require('qr.js')

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

module.exports = encode

