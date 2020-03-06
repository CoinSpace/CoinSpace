'use strict';

var Ractive = require('widgets/modals/base');
var showError = require('widgets/modals/flash').showError;
var _ = require('lodash');
var moonpay = require('lib/moonpay');
var initBirthdayPicker = require('widgets/birthdaypicker');
var initDropdown = require('widgets/dropdown');

var ractive;

function open(onSuccessDismiss) {

  var customer = moonpay.getCustomer();

  ractive = new Ractive({
    partials: {
      content: require('./_content.ract')
    },
    data: {
      isLoading: false,
      step: 1,
      identity: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        dateOfBirth: customer.dateOfBirth ? new Date(customer.dateOfBirth) : null,
        address: {
          street: customer.address.street,
          subStreet: customer.address.subStreet,
          town: customer.address.town,
          postCode: customer.address.postCode,
          state: customer.address.state,
          country: customer.address.country || moonpay.getIpCountry(),
        }
      },
      showStates: false,
      isInited: moonpay.getCountries('allowed').length !== 0,
    }
  });

  var birthdayPicker;
  var countryPicker;
  var statePicker;

  if (moonpay.getCountries('allowed').length === 0) {
    moonpay.loadCountries('allowed').then(function() {
      ractive.set('isInited', true);
      initPickers();
    }).catch(console.error);
  } else {
    initPickers();
  }

  function initPickers() {
    var date = ractive.get('identity.dateOfBirth');
    birthdayPicker = initBirthdayPicker(ractive.find('#moonpay_identity_dateofbirth'), date);

    var countries = moonpay.getCountries('allowed');
    var selectedCountry = ractive.get('identity.address.country');
    countryPicker = initDropdown(ractive.find('#moonpay_identity_country'), countries, selectedCountry);
    renderStatePicker(selectedCountry);
    countryPicker.on('on-change', function() {
      var code = countryPicker.getValue();
      ractive.set('identity.address', {
        street: null,
        subStreet: null,
        town: null,
        postCode: null,
        state: null,
        country: code,
      });
      renderStatePicker(code);
    });
  }

  function renderStatePicker(code) {
    var countries = moonpay.getCountries('allowed');
    var country = code ? countries.find(function(country) { return country.code === code; }) : countries[0];
    if (country && country.states) {
      ractive.set('showStates', true);
      var selectedState = ractive.get('identity.address.state') || undefined;
      statePicker = initDropdown(ractive.find('#moonpay_identity_address_state'), country.states, selectedState);
    } else {
      ractive.set('showStates', false);
      statePicker = null;
    }
  }

  ractive.on('continue', function() {
    ractive.set('step', 2);
  });

  ractive.on('back', function() {
    ractive.set('step', 1);
  });

  ractive.on('submit', function() {
    ractive.set('isLoading', true);

    var identity = ractive.get('identity');
    identity.dateOfBirth = birthdayPicker.getBirthday();
    identity.address.country = countryPicker.getValue();
    identity.address.state = statePicker && statePicker.getValue();

    if (!identity.firstName || !identity.lastName || !identity.address.street || !identity.address.town || !identity.address.postCode) {
      return handleError(new Error('Please enter a valid info'));
    }

    var data = {};
    Object.keys(identity).forEach(function(key) {
      if (key === 'address') {
        if (_.isEqual(identity.address, customer.address)) return;
        data.address = identity.address;
        return;
      }
      if (identity[key] !== customer[key]) {
        data[key] = identity[key];
      }
    });

    if (_.isEmpty(data)) return ractive.fire('cancel');

    return moonpay.updateCustomer(data).then(function(data) {
      moonpay.setCustomer(data);
      ractive.set('onDismiss', function() {
        if (onSuccessDismiss) onSuccessDismiss();
      });
      ractive.fire('cancel');
    }).catch(function(err) {
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
