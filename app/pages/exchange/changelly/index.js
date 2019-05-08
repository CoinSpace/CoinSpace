'use strict';

var Ractive = require('lib/ractive');
var emitter = require('lib/emitter');
var initCreate = require('./create');
var initEnterAmount = require('./enter-amount');
var initAwaitingDeposit = require('./awaiting-deposit');
var initAwaiting = require('./awaiting');
var initComplete = require('./complete');
var initError = require('./error');
var db = require('lib/db');
var changelly = require('lib/changelly');
var showError = require('widgets/modals/flash').showError;

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
    enterAmount: initEnterAmount(ractive.find('#changelly_enter_amount')),
    create: initCreate(ractive.find('#changelly_create')),
    awaitingDeposit: initAwaitingDeposit(ractive.find('#changelly_awaiting_deposit')),
    awaiting: initAwaiting(ractive.find('#changelly_awaiting')),
    complete: initComplete(ractive.find('#changelly_complete')),
    error: initError(ractive.find('#changelly_error'))
  };
  var currentStep = steps.enterAmount;

  ractive.on('before-show', function() {
    emitter.emit('changelly');
  });

  ractive.on('before-hide', function() {
    ractive.set('isLoading', true);
    currentStep.hide();
  });

  emitter.on('changelly', function() {
    var changellyInfo = db.get('changellyInfo');
    if (!changellyInfo) {
      ractive.set('isLoading', false);
      return showStep(steps.enterAmount);
    }

    changelly.getTransaction(changellyInfo.id).then(function(tx) {
      ractive.set('isLoading', false);
      if (tx.status === 'waiting') {
        showStep(steps.awaitingDeposit, changellyInfo);
      } else if (['confirming', 'exchanging', 'sending', 'hold'].indexOf(tx.status) !== -1) {
        changellyInfo.status = tx.status;
        showStep(steps.awaiting, changellyInfo);
      } else if (tx.status === 'finished') {
        changellyInfo.amount = tx.amountTo;
        showStep(steps.complete, changellyInfo);
      } else if (tx.status === 'failed') {
        showStep(steps.error, {
          message: 'Transaction (ID: :id) has failed. Please, contact Changelly.',
          interpolations: {
            id: changellyInfo.id
          },
          showEmail: true
        });
      } else if (tx.status === 'refunded') {
        showStep(steps.error, {
          message: 'Exchange failed and coins were refunded to :address.',
          interpolations: {
            address: changellyInfo.returnAddress
          },
        });
      } else if (tx.status === 'overdue') {
        showStep(steps.error, {message: "Payment wasn't received since 36 hours since the transaction was created."});
      } else {
        showStep(steps.error, {message: tx.error});
      }
    }).catch(function(err) {
      console.error(err);
      ractive.set('isLoading', false);
      return showError({message: err.message});
    });
  });

  emitter.on('change-changelly-step', function(step, data) {
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
