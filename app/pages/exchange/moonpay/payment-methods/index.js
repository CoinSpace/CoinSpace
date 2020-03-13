'use strict';

var Ractive = require('lib/ractive');
var emitter = require('lib/emitter');
var moonpay = require('lib/moonpay');
var showAddCreditCard = require('widgets/modals/moonpay/add-credit-card');
var showAddBankAccount = require('widgets/modals/moonpay/add-bank-account');
var showRemoveConfirmation = require('widgets/modals/confirm-remove');

module.exports = function(el) {
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      isLoading: true,
      cards: [],
      bankAccounts: [],
      deleteCard: deleteCard,
      deleteBankAccount: deleteBankAccount
    },
    partials: {
      loader: require('../loader.ract'),
    }
  });

  ractive.on('before-show', function() {
    ractive.set('isLoading', true);
    ractive.set('cards', []);
    ractive.set('bankAccounts', []);
    return Promise.all([
      moonpay.getCards(),
      moonpay.getBankAccounts()
    ]).then(function(results) {
      var cards = results[0];
      var bankAccounts = results[1];
      ractive.set('isLoading', false);
      ractive.set('cards', cards);
      ractive.set('bankAccounts', bankAccounts);
    }).catch(function(err) {
      ractive.set('isLoading', false);
      console.error(err);
    });
  });

  ractive.on('back', function() {
    emitter.emit('change-moonpay-step', 'main');
  });

  ractive.on('add-credit-card', function() {
    showAddCreditCard({onSuccessDismiss: function() {
      ractive.show();
    }});
  });

  ractive.on('add-bank-account', function() {
    showAddBankAccount({onSuccessDismiss: function() {
      ractive.show();
    }});
  });

  function deleteCard(card) {
    var rindex = ractive.get('cards').indexOf(card);
    showRemoveConfirmation(card.label, function(modal) {
      return moonpay.deleteCard(card.id).then(function() {
        modal.set('onDismiss', function() {
          ractive.splice('cards', rindex, 1);
        });
        modal.fire('cancel');
      }).catch(function(err) {
        console.error(err);
        modal.fire('cancel');
      });
    });
  }

  function deleteBankAccount(bankAccount) {
    var rindex = ractive.get('bankAccounts').indexOf(bankAccount);
    showRemoveConfirmation(bankAccount.label, function(modal) {
      return moonpay.deleteBankAccount(bankAccount.id).then(function() {
        modal.set('onDismiss', function() {
          ractive.splice('bankAccounts', rindex, 1);
        });
        modal.fire('cancel');
      }).catch(function(err) {
        console.error(err);
        modal.fire('cancel');
      });
    });
  }

  return ractive;
}
