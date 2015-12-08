'use strict';

var Ractive = require('cs-ractive')
var emitter = require('cs-emitter')
var openSupportModal = require('cs-modal-support')
var Dropdown = require('cs-transitions/dropdown.js')
var initAccount = require('cs-account-details')

module.exports = function(el){
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract').template
  })

  initAccount(ractive.nodes['account-details'])

  ractive.on('open-support', function(){
    openSupportModal()
  })

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
