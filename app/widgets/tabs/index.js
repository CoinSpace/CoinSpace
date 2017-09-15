'use strict';

var $ = require('browserify-zepto')
var Ractive = require('lib/ractive')
var emitter = require('lib/emitter')
var Hammer = require('hammerjs')

module.exports = function(el){
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract')
  })

  var active;
  function highlightTab(node){
    if(node !== active && active && $(active).hasClass('active')) {
      $(active).removeClass('active')
    }
    $(node).addClass('active')
    active = node
  }

  emitter.on('wallet-ready', function() {
    highlightTab(ractive.find('#send_tab'));
  });

  emitter.on('swipe-tab', function(state) {
    highlightTab(state);
  });

    Hammer(document.getElementById('main'), {velocity: 0.1}).on("swipeleft", function() {
        if(process.env.BUILD_TYPE === 'phonegap'){
            if($("#send_tab").hasClass('active')){
                emitter.emit('swipe-tab', document.getElementById('receive_tab'))
                emitter.emit('change-tab', 'receive')
            } else if($("#receive_tab").hasClass('active')){
                emitter.emit('swipe-tab', document.getElementById('history_tab'))
                emitter.emit('change-tab', 'history')
            } else if($("#history_tab").hasClass('active')){
                emitter.emit('swipe-tab', document.getElementById('tokens_tab'))
                emitter.emit('change-tab', 'tokens')
            }
        }
    })

    Hammer(document.getElementById('main'), {velocity: 0.1}).on("swiperight", function() {
        if(process.env.BUILD_TYPE === 'phonegap'){
            if($("#receive_tab").hasClass('active')){
                emitter.emit('swipe-tab', document.getElementById('send_tab'))
                emitter.emit('change-tab', 'send')
            } else if($("#history_tab").hasClass('active')){
                emitter.emit('swipe-tab', document.getElementById('receive_tab'))
                emitter.emit('change-tab', 'receive')
            } else if($("#tokens_tab").hasClass('active')){
                emitter.emit('swipe-tab', document.getElementById('history_tab'))
                emitter.emit('change-tab', 'history')
            }
        }
    })

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
