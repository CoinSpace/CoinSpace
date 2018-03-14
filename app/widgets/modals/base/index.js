'use strict';

var Ractive = require('lib/ractive')
var fadeIn = require('lib/transitions/fade.js').fadeIn
var fadeOut = require('lib/transitions/fade.js').fadeOut

var Modal = Ractive.extend({
  el: document.getElementById('general-purpose-overlay'),
  template: require('./index.ract'),
  partials: {
    content: require('./content.ract'),
  },
  onrender: function(){

    var self = this
    var fadeEl = self.find('.js__fadeEl')

    fadeIn(fadeEl, self.get('fadeInDuration'), function() {
      fadeEl.focus()
      var onFocus = self.get('onFocus')
      if(onFocus) onFocus();
    })

    self.on('cancel', function(context){
      if(!context.node) return dismissModal();
      var originalElement = context.original.srcElement || context.original.originalTarget;
      if(originalElement.classList && originalElement.classList.contains('_cancel')) {
        dismissModal()
      }
    })

    function dismissModal(){
      var onDismiss = self.get('onDismiss')
      if(onDismiss) onDismiss();
      fadeOut(fadeEl)
    }
  }
})

module.exports = Modal

