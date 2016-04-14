'use strict';

var Ractive = require('cs-ractive')
var emitter = require('cs-emitter')
var $ = require('browserify-zepto')

module.exports = function (el) {
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract').template
  })

  ractive.on('back', function (e) {
    e.original.preventDefault()
    setTimeout(function () {
      $('#terms').addClass('closed')
      $('#sidebar').addClass('open')
      $('#main').removeClass('terms-open')
      $('#terms').removeClass('terms-open')
    }, 0)
  })

  return ractive
}
