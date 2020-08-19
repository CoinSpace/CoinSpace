'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const moonpay = require('lib/moonpay');
const showAddCreditCard = require('widgets/modals/moonpay/add-credit-card');
const showAddBankAccount = require('widgets/modals/moonpay/add-bank-account');
const showRemoveConfirmation = require('widgets/modals/confirm-remove');

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      isLoading: true,
      cards: [],
      bankAccounts: [],
      deleteCard,
      deleteBankAccount,
    },
    partials: {
      loader: require('../loader.ract'),
    },
  });

  ractive.on('before-show', () => {
    ractive.set('isLoading', true);
    ractive.set('cards', []);
    ractive.set('bankAccounts', []);
    return Promise.all([
      moonpay.getCards(),
      moonpay.getBankAccounts(),
    ]).then((results) => {
      const cards = results[0];
      const bankAccounts = results[1];
      ractive.set('isLoading', false);
      ractive.set('cards', cards);
      ractive.set('bankAccounts', bankAccounts);
    }).catch((err) => {
      ractive.set('isLoading', false);
      console.error(err);
    });
  });

  ractive.on('back', () => {
    emitter.emit('change-moonpay-step', 'main');
  });

  ractive.on('add-credit-card', () => {
    showAddCreditCard({ onSuccessDismiss() {
      ractive.show();
    } });
  });

  ractive.on('add-bank-account', () => {
    showAddBankAccount({ onSuccessDismiss() {
      ractive.show();
    } });
  });

  function deleteCard(card) {
    const rindex = ractive.get('cards').indexOf(card);
    showRemoveConfirmation(card.label, (modal) => {
      return moonpay.deleteCard(card.id).then(() => {
        modal.set('onDismiss', () => {
          ractive.splice('cards', rindex, 1);
        });
        modal.fire('cancel');
      }).catch((err) => {
        console.error(err);
        modal.fire('cancel');
      });
    });
  }

  function deleteBankAccount(bankAccount) {
    const rindex = ractive.get('bankAccounts').indexOf(bankAccount);
    showRemoveConfirmation(bankAccount.label, (modal) => {
      return moonpay.deleteBankAccount(bankAccount.id).then(() => {
        modal.set('onDismiss', () => {
          ractive.splice('bankAccounts', rindex, 1);
        });
        modal.fire('cancel');
      }).catch((err) => {
        console.error(err);
        modal.fire('cancel');
      });
    });
  }

  return ractive;
};
