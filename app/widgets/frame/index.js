'use strict';

var Ractive = require('cs-ractive')
var emitter = require('cs-emitter')
var initHeader = require('cs-header')
var initTabs = require('cs-tabs')
var initSidebar = require('cs-sidebar')
var initTerms = require('cs-terms')
var initSend = require('cs-send')
var initReceive = require('cs-receive')
var initHistory = require('cs-history')
var initTokens = require('cs-tokens')
var $ = require('browserify-zepto')

module.exports = function(el){
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract').template
  })

  // widgets
  var header = initHeader(ractive.nodes['header'])
  initTabs(ractive.nodes['tabs'])
  initSidebar(ractive.nodes['sidebar'])
  initTerms(ractive.nodes['terms'])

  // tabs
  var tabs = {
    send: initSend(ractive.nodes['send']),
    receive: initReceive(ractive.nodes['receive']),
    history: initHistory(ractive.nodes['history']),
    tokens: initTokens(ractive.nodes['tokens'])
  }

  var currentPage = tabs.send
  showPage(tabs.send)

  emitter.on('change-tab', function(tab) {
    showPage(tabs[tab])
  })

  emitter.on('open-terms', function(tab) {
    $("#main").addClass('terms-open');
    $("#terms").addClass('terms-open');

    var classes = ractive.find("#sidebar").classList
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
    var classes = ractive.find("#main").classList
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
