'use strict';

var Ractive = require('widgets/modals/base');
var showError = require('widgets/modals/flash').showError;
var moonpay = require('lib/moonpay');
var initDropdown = require('widgets/dropdown');

var ractive;

function open(data) {

  var customer = moonpay.getCustomer();
  var fiatSymbol = moonpay.getFiatById(customer.defaultCurrencyId, 'symbol');
  if (['EUR', 'GBP'].indexOf(fiatSymbol) === -1) {
    fiatSymbol = 'EUR';
  };

  ractive = new Ractive({
    partials: {
      content: require('./_content.ract')
    },
    data: {
      isLoading: false,
      bankAccount: {
        currencyCode: fiatSymbol
      }
    }
  });

  var currencyPicker = initDropdown(ractive.find('#moonpay_add_bank_account_currency'), [
    {code: 'EUR', name: 'EUR (SEPA bank)'},
    {code: 'GBP', name: 'GBP (UK bank)'}
  ], fiatSymbol);

  currencyPicker.on('on-change', function() {
    var currency = currencyPicker.getValue();
    ractive.set('bankAccount.currencyCode', currency);
  });

  ractive.on('add', function() {
    ractive.set('isLoading', true);

    var bankAccount = ractive.get('bankAccount');
    if (bankAccount.currencyCode === 'EUR' && !bankAccount.iban) {
      return handleError(new Error('Please enter a valid info'));
    }
    if (bankAccount.currencyCode === 'GBP' && (!bankAccount.accountNumber || !bankAccount.sortCode)) {
      return handleError(new Error('Please enter a valid info'));
    }
    return moonpay.createBankAccount(bankAccount).then(function() {
      ractive.set('onDismiss', data && data.onSuccessDismiss);
      ractive.fire('cancel');
    }).catch(function(err) {
      if (/Invalid body/.test(err.message)) {
        return handleError(new Error('Please enter a valid info'));
      }
      console.error(err);
      return handleError(new Error('Unsupported bank'));
    });
  });

  function handleError(err) {
    ractive.set('isLoading', false);
    showError({message: err.message});
  }

  return ractive;
}

module.exports = open;
