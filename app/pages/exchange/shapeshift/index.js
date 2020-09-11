'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const initCreate = require('./create');
const initAwaitingDeposit = require('./awaiting-deposit');
const initAwaiting = require('./awaiting');
const initComplete = require('./complete');
const initError = require('./error');
const details = require('lib/wallet/details');
const shapeshift = require('lib/shapeshift');
const { showError } = require('widgets/modals/flash');

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      isLoading: true,
    },
    partials: {
      loader: require('./loader.ract'),
    },
  });

  const steps = {
    create: initCreate(ractive.find('#shapeshift_create')),
    awaitingDeposit: initAwaitingDeposit(ractive.find('#shapeshift_awaiting_deposit')),
    awaiting: initAwaiting(ractive.find('#shapeshift_awaiting')),
    complete: initComplete(ractive.find('#shapeshift_complete')),
    error: initError(ractive.find('#shapeshift_error')),
  };
  let currentStep = steps.create;

  ractive.on('before-show', () => {
    emitter.emit('shapeshift');
  });

  ractive.on('before-hide', () => {
    ractive.set('isLoading', true);
    currentStep.hide();
  });

  emitter.on('shapeshift', () => {
    const shapeshiftInfo = details.get('shapeshiftInfo');
    if (!shapeshiftInfo) {
      ractive.set('isLoading', false);
      return showStep(steps.create);
    }

    shapeshift.txStat(shapeshiftInfo.depositAddress).then((data) => {
      ractive.set('isLoading', false);
      if (data.status === 'no_deposits') {
        showStep(steps.awaitingDeposit, shapeshiftInfo);
      } else if (data.status === 'received') {
        showStep(steps.awaiting, shapeshiftInfo);
      } else if (data.status === 'complete') {
        showStep(steps.complete, data);
      } else {
        showStep(steps.error, { message: data.error });
      }
    }).catch((err) => {
      console.error(err);
      ractive.set('isLoading', false);
      return showError({ message: err.message });
    });
  });

  emitter.on('change-shapeshift-step', (step, data) => {
    showStep(steps[step], data);
  });

  function showStep(step, data) {
    setTimeout(() => {
      currentStep.hide();
      step.show(data);
      currentStep = step;
    });
  }

  return ractive;
};
