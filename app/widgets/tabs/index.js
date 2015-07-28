'use strict';

var $ = require('browserify-zepto')
var Ractive = require('cs-ractive')
var emitter = require('cs-emitter')

module.exports = function(el){
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract').template
  })

  var active;
  function highlightTab(node){
    if(node !== active && active && $(active).hasClass('active')) {
      $(active).removeClass('active')
    }
    $(node).addClass('active')
    active = node
  }

  emitter.on('balance-ready', function() {
    highlightTab(ractive.nodes.send_tab);
  });

  emitter.on('toggle-menu', function(open) {
    var classes = ractive.el.classList
    if(open) {
      classes.add('open')
    } else {
      classes.remove('open')
    }
  })

  ractive.on('select', function(event){
    event.original.preventDefault();
    emitter.emit('change-tab', event.node.dataset.tab)
    highlightTab(event.node);
  })

  return ractive
}
