'use strict';

var Ractive = require('cs-ractive')
var getAvatar = require('cs-avatar').getAvatar
var emitter = require('cs-emitter')
var geo = require('cs-geo')
var showError = require('cs-modal-flash').showError
var fadeIn = require('cs-transitions/fade.js').fadeIn
var fadeOut = require('cs-transitions/fade.js').fadeOut
var animatePin = require('cs-transitions/pinDrop.js').drop
var resetPin = require('cs-transitions/pinDrop.js').reset
var spinner = require('cs-transitions/spinner.js')

module.exports = function(el){
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract').template,
    data: {
      exchangeRates: {},
      nearbys: [],
      searching: true,
      getAvatar: getAvatar
    }
  })

  emitter.on('open-overlay', function(data){
    if(data.overlay === 'geo') {
      ractive.set('searching', true)
      fadeIn(ractive.find('.js__fadeEl'), function() {
        ractive.set('search_message', 'Searching your area for other Coin Space users')
        ractive.fire('search-nearby')
      })
    }
  })

  ractive.on('select', function(event){
    event.original.preventDefault()
    var address = event.node.getAttribute( 'data-wallet' )
    emitter.emit('prefill-wallet', address)
    ractive.fire('close-geo')
  })

  ractive.on('search-nearby', function(){
    var pinEl = ractive.nodes['geo-pin']
    var pulseEl = ractive.nodes['geo-pulse']
    resetPin(pinEl, function() {
      animatePin(pinEl, pulseEl)
    })
    lookupGeo('new')
  })

  ractive.on('search-again', function() {
    ractive.set('searchingAgain', true)
    spinner.spin(ractive.nodes.refresh_el)
    lookupGeo()
  })

  ractive.on('close-geo', function(){
    fadeOut(ractive.find('.js__fadeEl'), function(){
      if(ractive.get('searching')) {
        var pinEl = ractive.nodes['geo-pin']
        resetPin(pinEl)
      }
      ractive.set('nearbys', [])
      ractive.set('searching', false)
      emitter.emit('close-overlay')
      geo.remove()
    })
  })

  function lookupGeo(context) {
    geo.search(function(err, results){

      if(ractive.get('searchingAgain')) {
        // wait for spinner to spin down
        setTimeout(function(){
          ractive.set('searchingAgain', false)
        }, 1000)
      }

      if(err) {
        spinner.stop(ractive.nodes.refresh_el)
        return showError({
          message: err.message,
          onDismiss: function(){
            ractive.fire('close-geo')
          }
        })
      }

      if(context === 'new') {
        // set a brief timeout so it "feels" like we're searching
        setTimeout(function(){
          setNearbys(results)
          var pinEl = ractive.nodes['geo-pin']
          resetPin(pinEl)
          ractive.set('searching', false)
        }, 1500)
      } else {
        setNearbys(results)
        spinner.stop(ractive.nodes.refresh_el)
      }
    })
  }

  function setNearbys(results) {
    var nearbys

    if(results == null || results.length < 1) {
      nearbys = []
    } else {
      nearbys = results.map(function(record){
        return record[0]
      })
    }

    ractive.set('nearbys', nearbys)
  }

  return ractive
}
