'use strict';

var Ractive = require('lib/ractive')
var getAvatar = require('lib/avatar').getAvatar
var emitter = require('lib/emitter')
var geo = require('lib/geo')
var showError = require('widgets/modals/flash').showError
var fadeIn = require('lib/transitions/fade.js').fadeIn
var fadeOut = require('lib/transitions/fade.js').fadeOut
var animatePin = require('lib/transitions/pinDrop.js').drop
var resetPin = require('lib/transitions/pinDrop.js').reset

module.exports = function(el){
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      exchangeRates: {},
      nearbys: [],
      searching: true,
      getAvatar: getAvatar,
      context: '',
      network: null
    }
  })

  emitter.on('open-overlay', function(data) {
    if(data.overlay === 'geo') {
      ractive.set('searching', true)
      fadeIn(ractive.find('.js__fadeEl'), function() {
        ractive.set({
          context: data.context,
          network: data.network,
          search_message: 'Searching your area for other Coin users'
        });
        ractive.fire('search-nearby')
      })
    }
  })

  ractive.on('select', function(context){
    context.original.preventDefault()
    var address = context.node.getAttribute( 'data-wallet' )
    emitter.emit('prefill-wallet', address, ractive.get('context'))
    ractive.fire('close-geo')
  })

  ractive.on('search-nearby', function(){
    var pinEl = ractive.find('#geo-pin')
    var pulseEl = ractive.find('#geo-pulse')
    resetPin(pinEl, function() {
      animatePin(pinEl, pulseEl)
    })
    lookupGeo('new')
  })

  ractive.on('search-again', function() {
    if (ractive.get('searchingAgain')) return false;
    ractive.set('searchingAgain', true)
    ractive.find('#refresh_el').classList.add('loading')
    lookupGeo()
  })

  ractive.on('close-geo', function(){
    fadeOut(ractive.find('.js__fadeEl'), function(){
      if(ractive.get('searching')) {
        var pinEl = ractive.find('#geo-pin')
        resetPin(pinEl)
      }
      ractive.set('nearbys', [])
      ractive.set('searching', false)
      emitter.emit('close-overlay')
    })
  })

  function lookupGeo(context) {
    geo.search(ractive.get('network'), function(err, results) {

      if (ractive.get('searchingAgain')) {
        // wait for spinner to spin down
        setTimeout(function(){
          ractive.set('searchingAgain', false)
          cancelSpinner();
        }, 1000)
      }

      if (err) {
        cancelSpinner();
        return showError({
          message: err.message
        }).on('cancel', function() {
          ractive.fire('close-geo');
        })
      }

      if (context === 'new') {
        // set a brief timeout so it "feels" like we're searching
        setTimeout(function(){
          setNearbys(results)
          var pinEl = ractive.find('#geo-pin')
          resetPin(pinEl)
          ractive.set('searching', false)
        }, 1500)
      } else {
        setNearbys(results)
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

  function cancelSpinner() {
    if (!ractive.find('#refresh_el')) return ractive;
    var refresh_el = ractive.find('#refresh_el');
    refresh_el.classList.remove('loading')
  }

  return ractive
}
