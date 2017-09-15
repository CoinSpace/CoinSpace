'use strict';

var Ractive = require('lib/ractive')
var emitter = require('lib/emitter')
var initHeader = require('widgets/header')
var initTabs = require('widgets/tabs')
var initSidebar = require('widgets/sidebar')
var initTerms = require('widgets/terms')
var initSend = require('pages/send')
var initReceive = require('pages/receive')
var initHistory = require('pages/history')
var initTokens = require('pages/tokens')
var $ = require('browserify-zepto')

module.exports = function(el){
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract')
  })

  // widgets
  var header = initHeader(ractive.find('#header'))
  initTabs(ractive.find('#tabs'))
  initSidebar(ractive.find('#sidebar'))
  initTerms(ractive.find('#terms'))

  // tabs
  var tabs = {
    send: initSend(ractive.find('#send')),
    receive: initReceive(ractive.find('#receive')),
    history: initHistory(ractive.find('#history')),
    tokens: initTokens(ractive.find('#tokens'))
  }

  var currentPage = tabs.send
  showPage(tabs.send)

  emitter.on('change-tab', function(tab) {
    showPage(tabs[tab])
  })

  emitter.on('open-terms', function(tab) {
    $("#main").addClass('terms-open');
    $("#terms").addClass('terms-open');

    var classes = ractive.find('#sidebar').classList
    classes.add('animating')
    classes.remove('open')

    setTimeout(function(){
      $("#terms").removeClass('closed')
    }, 0)
    setTimeout(function(){
      classes.remove('animating')
    }, 300)
  })

  function showPage(page){
    currentPage.hide()
    page.show()
    currentPage = page
  }

  // menu toggle
  emitter.on('toggle-menu', function(open) {
    var classes = ractive.find('#main').classList
    if(open) {
      ractive.set('sidebar_open', true)
      classes.add('closed')
    } else {
      ractive.set('sidebar_open', false)
      classes.remove('closed')
    }

    header.toggleIcon(open)
  })

  return ractive
}
