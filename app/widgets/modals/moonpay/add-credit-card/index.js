'use strict';

const Ractive = require('widgets/modals/base');
const { showError } = require('widgets/modals/flash');
const moonpay = require('lib/moonpay');
const initDropdown = require('widgets/dropdown');
const mpSdk = require('@moonpay/browser').default;

let ractive;

function open(data) {
  const customer = moonpay.getCustomer();
  // eslint-disable-next-line max-len
  const hasAddress = customer.address.street && customer.address.town && customer.address.postCode && customer.address.country;

  ractive = new Ractive({
    partials: {
      content: require('./_content.ract'),
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
        country: customer.address.country || moonpay.getIpCountry(),
      },
      showStates: false,
      isInited: moonpay.getCountries('allowed').length !== 0,
      isCcFormInited: false,
      hasIframe: true,
    },
  });

  let countryPicker;
  let statePicker;
  let ccForm;
  let ccFields = {};
  let billingAddress;

  if (moonpay.getCountries('allowed').length === 0) {
    moonpay.loadCountries('allowed').then(() => {
      ractive.set('isInited', true);
      initPickers();
    }).catch(console.error);
  } else {
    initPickers();
  }

  function initPickers() {
    const countries = moonpay.getCountries('allowed');
    const selectedCountry = ractive.get('billingAddress.country');
    countryPicker = initDropdown(ractive.find('#moonpay_add_credit_card_country'), countries, selectedCountry);
    renderStatePicker(selectedCountry);
    countryPicker.on('on-change', () => {
      const code = countryPicker.getValue();
      renderStatePicker(code);
    });
  }

  function renderStatePicker(code) {
    const countries = moonpay.getCountries('allowed');
    const country = code ? countries.find((country) => { return country.code === code; }) : countries[0];
    if (country && country.states) {
      ractive.set('showStates', true);
      const selectedState = ractive.get('billingAddress.state') || undefined;
      statePicker = initDropdown(ractive.find('#moonpay_add_credit_card_state'), country.states, selectedState);
    } else {
      ractive.set('showStates', false);
      statePicker = null;
    }
  }

  ractive.on('toggle-same-address', () => {
    const sameAddressChecked = ractive.get('sameAddressChecked');
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
        country: moonpay.getIpCountry(),
      });
    }
    initPickers();
  });

  ractive.on('back', () => {
    ractive.fire('ios-blur');
    ractive.set('step', 1);
  });

  ractive.on('continue', () => {

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

    ccForm = mpSdk.createCardDetailsForm((state) => {
      if (!ractive.get('isCcFormInited') && state.number && state.cvc && state.expiryDate) {
        ractive.set('isCcFormInited', true);
      }
    });

    const css = {
      fontSize: '16px',
      color: '#333333',
      '&::-webkit-input-placeholder': {
        color: '#b3b3b3',
      },
      '&:-moz-placeholder': {
        color: '#b3b3b3',
      },
    };

    ccFields = {
      'cc-number': ccForm.createField('.js-cc-number ._field', {
        type: 'card-number',
        name: 'number',
        css,
        placeholder: '4242 4242 4242 4242',
        validations: ['required', 'validCardNumber'],
        showCardIcon: true,
      }),
      'cc-exp': ccForm.createField('.js-cc-exp ._field', {
        type: 'card-expiration-date',
        name: 'expiryDate',
        css,
        placeholder: '01 / 25',
        validations: ['required', 'validCardExpirationDate'],
        yearLength: 2,
      }),
      'cc-cvc': ccForm.createField('.js-cc-cvc ._field', {
        type: 'card-security-code',
        name: 'cvc',
        css,
        placeholder: '345',
        validations: ['required', 'validCardSecurityCode'],
      }),
    };
  }

  ractive.on('focus-cc-field', (context) => {
    const field = context.node.getAttribute('data-field');
    if (ccFields[field]) ccFields[field].focus();
  });

  ractive.on('add', () => {
    ractive.set('isLoading', true);
    ractive.fire('ios-blur');
    ccForm.submit(billingAddress, (status, response) => {
      moonpay.createCard(response.id).then(() => {
        ractive.set('onDismiss', data && data.onSuccessDismiss);
        ractive.fire('cancel');
      }).catch((err) => {
        if (/Basic customer information must be/.test(err.message)) {
          return handleError(new Error('Identity verification must be passed before saving card'));
        }
        if (/This card is already in use/.test(err.message)) {
          return handleError(new Error('This card is already in use on a different account'));
        }
        if (/Sorry, we only accept Visa, Mastercard and Maestro/.test(err.message)) {
          return handleError(new Error('Sorry, we only accept Visa, Mastercard and Maestro cards at present'));
        }
        if (/The billing address of this card does not match/.test(err.message)) {
          // eslint-disable-next-line max-len
          return handleError(new Error('The billing address of this card does not match the billing address that you entered, please try again'));
        }
        console.error(err);
        return handleError(new Error('Payment authorization declined'));
      });
    }, (err) => {
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
