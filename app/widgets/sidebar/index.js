'use strict';

var Ractive = require('lib/ractive')
var emitter = require('lib/emitter')
var Dropdown = require('lib/transitions/dropdown.js')
var initAccount = require('widgets/account-details')

module.exports = function(el){
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract')
  })

  initAccount(ractive.find('#account-details'))

  ractive.on('logout', function(event){
    event.original.preventDefault()
    window.location.reload()
  })

  ractive.on('about', function(e){
      emitter.emit('open-terms')
  })

  emitter.on('toggle-menu', function(open) {
    var classes = ractive.el.classList
    if(open) {
      classes.add('open')
    } else {
      classes.add('animating')
      classes.remove('open')
      setTimeout(function(){
        classes.remove('animating')
      }, 300)
    }
  })

  return ractive
}
