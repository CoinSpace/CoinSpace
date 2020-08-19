'use strict';

const Ractive = require('widgets/modals/base');
const { showError } = require('widgets/modals/flash');
const _ = require('lodash');
const moonpay = require('lib/moonpay');
const initBirthdayPicker = require('widgets/birthdaypicker');
const initDropdown = require('widgets/dropdown');

let ractive;

function open(onSuccessDismiss) {

  const customer = moonpay.getCustomer();

  ractive = new Ractive({
    partials: {
      content: require('./_content.ract'),
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
        },
      },
      showStates: false,
      isInited: moonpay.getCountries('allowed').length !== 0,
    },
  });

  let birthdayPicker;
  let countryPicker;
  let statePicker;

  if (moonpay.getCountries('allowed').length === 0) {
    moonpay.loadCountries('allowed').then(() => {
      ractive.set('isInited', true);
      initPickers();
    }).catch(console.error);
  } else {
    initPickers();
  }

  function initPickers() {
    const date = ractive.get('identity.dateOfBirth');
    birthdayPicker = initBirthdayPicker(ractive.find('#moonpay_identity_dateofbirth'), date);

    const countries = moonpay.getCountries('allowed');
    const selectedCountry = ractive.get('identity.address.country');
    countryPicker = initDropdown(ractive.find('#moonpay_identity_country'), countries, selectedCountry);
    renderStatePicker(selectedCountry);
    countryPicker.on('on-change', () => {
      const code = countryPicker.getValue();
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
    const countries = moonpay.getCountries('allowed');
    const country = code ? countries.find((country) => { return country.code === code; }) : countries[0];
    if (country && country.states) {
      ractive.set('showStates', true);
      const selectedState = ractive.get('identity.address.state') || undefined;
      statePicker = initDropdown(ractive.find('#moonpay_identity_address_state'), country.states, selectedState);
    } else {
      ractive.set('showStates', false);
      statePicker = null;
    }
  }

  ractive.on('continue', () => {
    ractive.set('step', 2);
  });

  ractive.on('back', () => {
    ractive.set('step', 1);
  });

  ractive.on('submit', () => {
    ractive.set('isLoading', true);

    const identity = ractive.get('identity');
    identity.dateOfBirth = birthdayPicker.getBirthday();
    identity.address.country = countryPicker.getValue();
    identity.address.state = statePicker && statePicker.getValue();

    // eslint-disable-next-line max-len
    if (!identity.firstName || !identity.lastName || !identity.address.street || !identity.address.town || !identity.address.postCode) {
      return handleError(new Error('Please enter a valid info'));
    }

    const data = {};
    Object.keys(identity).forEach((key) => {
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

    return moonpay.updateCustomer(data).then((data) => {
      moonpay.setCustomer(data);
      ractive.set('onDismiss', () => {
        if (onSuccessDismiss) onSuccessDismiss();
      });
      ractive.fire('cancel');
    }).catch((err) => {
      if (/Customer info update is disabled/.test(err.message)) {
        return handleError(new Error('Customer info update is disabled due to identity check status'));
      }
      if (/Your (post|ZIP) code is invalid/.test(err.message)) {
        return handleError(new Error('Your post code is invalid, please try again'));
      }
      if (/Your state is not supported/.test(err.message)) {
        return handleError(new Error('Your state is not supported at the moment, sorry for the inconvenience'));
      }
      console.error(err);
      return handleError(new Error('Please enter a valid info'));
    });
  });

  function handleError(err) {
    ractive.set('isLoading', false);
    showError({ message: err.message });
  }

  return ractive;
}

module.exports = open;
