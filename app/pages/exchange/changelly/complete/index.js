'use strict';

var Ractive = require('lib/ractive');
var emitter = require('lib/emitter');
var db = require('lib/db');

module.exports = function(el) {
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      toSymbol: '',
      toAddress: '',
      amount: ''
    },
    partials: {
      footer: require('../footer.ract')
    }
  });

  ractive.on('before-show', function(context) {
    ractive.set({
      toSymbol: context.toSymbol,
      toAddress: context.toAddress,
      amount: context.amount
    });
  });

  ractive.on('done', function() {
    db.set('changellyInfo', null).then(function() {
      emitter.emit('change-changelly-step', 'enterAmount');
    }).catch(function(err) {
      console.error(err);
    })
  });

  return ractive;
}
