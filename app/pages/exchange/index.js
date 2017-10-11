'use strict';

var Ractive = require('lib/ractive');
var emitter = require('lib/emitter');
var initCreate = require('./create');
var initAwaitingDeposit = require('./awaiting-deposit');
var initAwaiting = require('./awaiting');
var initComplete = require('./complete');
var initError = require('./error');
var db = require('lib/db');

module.exports = function(el) {
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      isLoading: true
    },
    partials: {
      loader: require('./loader.ract')
    }
  });

  var steps = {
    create: initCreate(ractive.find('#exchange_create')),
    awaitingDeposit: initAwaitingDeposit(ractive.find('#exchange_awaiting_deposit')),
    awaiting: initAwaiting(ractive.find('#exchange_awaiting')),
    complete: initComplete(ractive.find('#exchange_complete')),
    error: initError(ractive.find('#exchange_error'))
  };
  var currentStep = steps.create;

  ractive.on('before-show', function() {
    if (!db.isReady()) return;
    ractive.fire('init-shapeshift');
  });

  emitter.once('db-ready', function() {
    if (ractive.el.classList.contains('current')) {
      ractive.fire('init-shapeshift');
    }
  });

  ractive.once('init-shapeshift', function() {
    db.get(function(err, doc) {
      if (err) return console.error(err);
      ractive.set('isLoading', false);

      if (!doc.exchangeInfo) {
      // if (doc.exchangeInfo) {
        showStep(steps.create);
      }
      // } else {
      //   showStep(steps.awaitingDeposit, {
      //     depositAddress: 'LfmssDyX6iZvbVqHv6t9P6JWXia2JG7mdb',
      //     depositSymbol: 'LTC',
      //     depositMax: '13.4868',
      //     depositMin: '0.02299247 LTC',
      //     toSymbol: 'BTC',
      //     toAddress: '1N4h6WwnUaVgoDSh1X4cAcq294N1sKnwm1',
      //   });
      // }
    });
  });

  setTimeout(function() {
    // ractive.set('isLoading', false);
    // showStep(steps.create);

    // emitter.emit('set-exchange-awaiting-deposit', {
    //   depositAddress: 'LfmssDyX6iZvbVqHv6t9P6JWXia2JG7mdb',
    //   depositSymbol: 'LTC',
    //   depositMax: '13.4868',
    //   depositMin: '0.02299247 LTC',
    //   toSymbol: 'BTC',
    //   toAddress: '1N4h6WwnUaVgoDSh1X4cAcq294N1sKnwm1',
    // });
    // showStep(steps.awaitingDeposit);

    // showStep(steps.awaiting);

    // emitter.emit('set-exchange-complete', {
    //   amount: '0.01318363',
    //   toSymbol: '',
    //   toAddress: '18GgXVrcQhnB3QhLpq3np7eVLzDwCrgQQx'
    // });
    // showStep(steps.complete);

    // emitter.emit('set-exchange-error', 'Error message');
    // showStep(steps.error);
  }, 300);

  emitter.on('change-exchange-step', function(step, data) {
    showStep(steps[step], data);
  })

  function showStep(step, data) {
    currentStep.hide();
    step.show(data);
    currentStep = step;
  }

  return ractive;
}
