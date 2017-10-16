'use strict';

var Ractive = require('lib/ractive');
var emitter = require('lib/emitter');
var initCreate = require('./create');
var initAwaitingDeposit = require('./awaiting-deposit');
var initAwaiting = require('./awaiting');
var initComplete = require('./complete');
var initError = require('./error');
var db = require('lib/db');
var shapeshift = require('lib/shapeshift');
var showError = require('widgets/modal-flash').showError;

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
  var initOnDbReady = true;
  var currentStep = steps.create;

  ractive.on('before-show', function() {
    if (!db.isReady()) return;
    initOnDbReady = false;
    emitter.emit('shapeshift');
  });

  ractive.on('before-hide', function() {
    ractive.set('isLoading', true);
    currentStep.hide();
  });

  emitter.once('db-ready', function() {
    if (ractive.el.classList.contains('current') && initOnDbReady) {
      emitter.emit('shapeshift');
    }
  });

  emitter.on('shapeshift', function() {
    db.get('exchangeInfo', function(err, exchangeInfo) {
      if (err) return console.error(err);
      if (!exchangeInfo) {
        ractive.set('isLoading', false);
        return showStep(steps.create);
      }

      shapeshift.txStat(exchangeInfo.depositAddress).then(function(data) {
        ractive.set('isLoading', false);
        if (data.status === 'no_deposits') {
          showStep(steps.awaitingDeposit, exchangeInfo);
        } else if (data.status === 'received') {
          showStep(steps.awaiting, exchangeInfo);
        } else if (data.status === 'complete') {
          showStep(steps.complete, data);
        } else {
          showStep(steps.error, {message: data.error});
        }
      }).catch(function(err) {
        console.error(err);
        ractive.set('isLoading', false);
        return showError({message: err.message});
      });
    });
  });

  emitter.on('change-exchange-step', function(step, data) {
    showStep(steps[step], data);
  })

  function showStep(step, data) {
    setTimeout(function() {
      currentStep.hide();
      step.show(data);
      currentStep = step;
    });
  }

  return ractive;
}
