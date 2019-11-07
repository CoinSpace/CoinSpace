'use strict';

var Ractive = require('lib/ractive');
var emitter = require('lib/emitter');
var moonpay = require('lib/moonpay');
var showAddCreditCard = require('widgets/modals/moonpay/add-credit-card');
var showRemoveConfirmation = require('widgets/modals/confirm-remove');

module.exports = function(el) {
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      isLoading: true,
      cards: [],
      deleteCard: deleteCard
    },
    partials: {
      loader: require('../loader.ract'),
    }
  });

  ractive.on('before-show', function() {
    ractive.set('isLoading', true);
    return moonpay.getCards().then(function(cards) {
      ractive.set('isLoading', false);
      cards.forEach(function(card) {
        card.label = card.brand.toUpperCase() + '...x' + card.lastDigits;
      });
      cards.sort(function(a, b) {
        return (new Date(b.createdAt)).getTime() - (new Date(a.createdAt).getTime());
      });
      ractive.set('cards', cards);
    }).catch(function(err) {
      ractive.set('isLoading', false);
      console.error(err);
    });
  });

  ractive.on('back', function() {
    emitter.emit('change-moonpay-step', 'main');
  });

  ractive.on('add', function() {
    showAddCreditCard({onSuccessDismiss: function() {
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

  return ractive;
}
