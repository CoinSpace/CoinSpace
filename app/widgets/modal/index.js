'use strict';

var Ractive = require('cs-ractive')
var fadeIn = require('cs-transitions/fade.js').fadeIn
var fadeOut = require('cs-transitions/fade.js').fadeOut

var Modal = Ractive.extend({
  el: document.getElementById('general-purpose-overlay'),
  template: require('./index.ract').template,
  partials: {
    content: require('./content.ract').template,
  },
  init: function(){

    var self = this
    var fadeEl = self.find('.js__fadeEl')

    fadeIn(fadeEl, function(){
      fadeEl.focus()
    })

    self.on('cancel', function(event){
      if(!event) return dismissModal();
      var originalElement = event.original.srcElement || event.original.originalTarget;
      if(originalElement.classList.contains('_cancel')) {
        dismissModal()
      }
    })

    document.addEventListener('keydown', keydownHandler)

    self.on('teardown', function () {
      window.removeEventListener('keydown', keydownHandler)
    }, false)

    function dismissModal(){
      var onDismiss = self.get('onDismiss')
      if(onDismiss) onDismiss();
      fadeOut(fadeEl, function() {
        self.teardown()
      })
    }

    function keydownHandler(event) {
      if(event.keyCode === 27){ //esc
        dismissModal()
      }
    }
  }
})

module.exports = Modal

