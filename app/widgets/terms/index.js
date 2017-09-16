'use strict';

var Ractive = require('lib/ractive')
var $ = require('browserify-zepto')

module.exports = function (el) {
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract')
  })

  ractive.on('back', function (context) {
    context.original.preventDefault()
    setTimeout(function () {
      $('#terms').addClass('closed')
      $('#sidebar').addClass('open')
      $('#main').removeClass('terms-open')
      $('#terms').removeClass('terms-open')
    }, 0)
  })

  return ractive
}
