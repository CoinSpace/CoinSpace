import Ractive from 'lib/ractive';
import emitter from 'lib/emitter';
import initCreate from './create';
import initEnterAmount from './enter-amount';
import initAwaitingDeposit from './awaiting-deposit';
import initAwaiting from './awaiting';
import initComplete from './complete';
import initError from './error';
import details from 'lib/wallet/details';
import changelly from 'lib/changelly';
import { showError } from 'widgets/modals/flash';
import template from './index.ract';
import loader from 'partials/loader/loader.ract';

export default function(el) {
  const ractive = new Ractive({
    el,
    template,
    data: {
      isLoading: true,
    },
    partials: {
      loader,
    },
  });

  const steps = {
    enterAmount: initEnterAmount(ractive.find('#changelly_enter_amount')),
    create: initCreate(ractive.find('#changelly_create')),
    awaitingDeposit: initAwaitingDeposit(ractive.find('#changelly_awaiting_deposit')),
    awaiting: initAwaiting(ractive.find('#changelly_awaiting')),
    complete: initComplete(ractive.find('#changelly_complete')),
    error: initError(ractive.find('#changelly_error')),
  };
  let currentStep = steps.enterAmount;

  ractive.on('before-show', () => {
    emitter.emit('changelly');
  });

  ractive.on('before-hide', () => {
    ractive.set('isLoading', true);
    currentStep.hide();
  });

  emitter.on('changelly', () => {
    const changellyInfo = details.get('changellyInfo');
    if (!changellyInfo) {
      ractive.set('isLoading', false);
      return showStep(steps.enterAmount);
    }

    changelly.getTransaction(changellyInfo.id).then((tx) => {
      ractive.set('isLoading', false);
      if (tx.status === 'waiting') {
        showStep(steps.awaitingDeposit, changellyInfo);
      } else if (['confirming', 'exchanging', 'sending', 'hold'].indexOf(tx.status) !== -1) {
        changellyInfo.status = tx.status;
        showStep(steps.awaiting, changellyInfo);
      } else if (tx.status === 'finished') {
        changellyInfo.amount = tx.amountTo;
        changellyInfo.payoutHashLink = tx.payoutHashLink;
        changellyInfo.payoutHash = tx.payoutHash;
        showStep(steps.complete, changellyInfo);
      } else if (tx.status === 'failed') {
        showStep(steps.error, {
          message: 'Transaction (ID: :id) has failed. Please, contact Changelly.',
          interpolations: {
            id: changellyInfo.id,
          },
          showEmail: true,
        });
      } else if (tx.status === 'refunded') {
        showStep(steps.error, {
          message: 'Exchange failed and coins were refunded to :address.',
          interpolations: {
            address: changellyInfo.returnAddress,
          },
        });
      } else if (tx.status === 'overdue') {
        showStep(steps.error, { message: "Payment wasn't received since 36 hours since the transaction was created." });
      } else {
        showStep(steps.error, { message: tx.error });
      }
    }).catch((err) => {
      console.error(err);
      ractive.set('isLoading', false);
      return showError({ message: err.message });
    });
  });

  emitter.on('change-changelly-step', (step, data) => {
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
}
