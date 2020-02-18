'use strict';

var Ractive = require('widgets/modals/base');
var showError = require('widgets/modals/flash').showError;
var moonpay = require('lib/moonpay');
var initDropdown = require('widgets/dropdown');
var mpSdk = require('@moonpay/browser').default;

var ractive;

function open(data) {
  var customer = moonpay.getCustomer();
  var hasAddress = customer.address.street && customer.address.town && customer.address.postCode && customer.address.country;

  ractive = new Ractive({
    partials: {
      content: require('./_content.ract')
    },
    data: {
      isLoading: false,
      step: 1,
      sameAddressChecked: hasAddress,
      billingAddress: {
        street: customer.address.street,
        subStreet: customer.address.subStreet,
        town: customer.address.town,
        postCode: customer.address.postCode,
        state: customer.address.state,
        country: customer.address.country || moonpay.getIpCountry()
      },
      showStates: false,
      isInited: moonpay.getCountries('allowed').length !== 0,
      isCcFormInited: false
    }
  });

  var countryPicker;
  var statePicker;
  var ccForm;
  var ccFields = {};
  var billingAddress;

  if (moonpay.getCountries('allowed').length === 0) {
    moonpay.loadCountries('allowed').then(function() {
      ractive.set('isInited', true);
      initPickers();
    }).catch(console.error);
  } else {
    initPickers();
  }

  function initPickers() {
    var countries = moonpay.getCountries('allowed');
    var selectedCountry = ractive.get('billingAddress.country');
    countryPicker = initDropdown(ractive.find('#moonpay_add_credit_card_country'), countries, selectedCountry);
    renderStatePicker(selectedCountry);
    countryPicker.on('on-change', function() {
      var code = countryPicker.getValue();
      renderStatePicker(code);
    });
  }

  function renderStatePicker(code) {
    var countries = moonpay.getCountries('allowed');
    var country = code ? countries.find(function(country) { return country.code === code; }) : countries[0];
    if (country && country.states) {
      ractive.set('showStates', true);
      var selectedState = ractive.get('billingAddress.state') || undefined;
      statePicker = initDropdown(ractive.find('#moonpay_add_credit_card_state'), country.states, selectedState);
    } else {
      ractive.set('showStates', false);
      statePicker = null;
    }
  }

  ractive.on('toggle-same-address', function() {
    var sameAddressChecked = ractive.get('sameAddressChecked');
    ractive.set('sameAddressChecked', !sameAddressChecked);
    if (!sameAddressChecked) {
      ractive.set('billingAddress', {
        street: customer.address.street,
        subStreet: customer.address.subStreet,
        town: customer.address.town,
        postCode: customer.address.postCode,
        state: customer.address.state,
        country: customer.address.country,
      });
    } else {
      ractive.set('billingAddress', {
        country: moonpay.getIpCountry()
      });
    }
    initPickers();
  });

  ractive.on('back', function() {
    ractive.fire('ios-blur');
    ractive.set('step', 1);
  });

  ractive.on('continue', function() {

    billingAddress = ractive.get('billingAddress');
    billingAddress.country = countryPicker.getValue();
    billingAddress.state = statePicker && statePicker.getValue();

    if (!billingAddress.street || !billingAddress.town || !billingAddress.postCode || !billingAddress.country) {
      return handleError(new Error('Please enter a valid info'));
    }

    ractive.set('step', 2);
    initCcForm();
  });

  function initCcForm() {
    if (ccForm) return;

    mpSdk.initialize(process.env.MOONPAY_API_KEY, customer.id);

    ccForm = mpSdk.createCardDetailsForm(function(state) {
      if (!ractive.get('isCcFormInited') && state.number && state.cvc && state.expiryDate) {
        ractive.set('isCcFormInited', true);
      }
    });

    var css = {
      fontSize: '16px',
      color: '#333333',
      '&::-webkit-input-placeholder': {
        color: '#b3b3b3'
      },
      '&:-moz-placeholder': {
        color: '#b3b3b3'
      }
    }

    ccFields = {
      'cc-number': ccForm.createField('.js-cc-number ._field', {
        type: 'card-number',
        name: 'number',
        css: css,
        placeholder: '4242 4242 4242 4242',
        validations: ['required', 'validCardNumber'],
        showCardIcon: true,
      }),
      'cc-exp': ccForm.createField('.js-cc-exp ._field', {
        type: 'card-expiration-date',
        name: 'expiryDate',
        css: css,
        placeholder: '01 / 25',
        validations: ['required', 'validCardExpirationDate'],
        yearLength: 2,
      }),
      'cc-cvc': ccForm.createField('.js-cc-cvc ._field', {
        type: 'card-security-code',
        name: 'cvc',
        css: css,
        placeholder: '345',
        validations: ['required', 'validCardSecurityCode'],
      })
    }
  }

  ractive.on('focus-cc-field', function(context) {
    var field = context.node.getAttribute('data-field');
    if (ccFields[field]) ccFields[field].focus();
  });

  ractive.on('add', function() {
    ractive.set('isLoading', true);
    ccForm.submit(billingAddress, function(status, response) {
      moonpay.createCard(response.id).then(function() {
        ractive.set('onDismiss', data && data.onSuccessDismiss);
        ractive.fire('cancel');
      }).catch(function(err) {
        if (/Basic customer information must be/.test(err.message)) {
          return handleError(new Error('Identity verification must be passed before saving card'));
        }
        console.error(err);
        return handleError(new Error('Payment authorization declined'));
      });
    }, function(err) {
      console.error(err);
      return handleError(new Error('Please enter a valid info'));
    });
  });

  function handleError(err) {
    ractive.set('isLoading', false);
    showError({message: err.message});
  }

  return ractive;
}

module.exports = open;
