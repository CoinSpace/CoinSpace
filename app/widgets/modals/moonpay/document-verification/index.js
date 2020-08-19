'use strict';

const Ractive = require('widgets/modals/base');
const { showError } = require('widgets/modals/flash');
const moonpay = require('lib/moonpay');
const initDropdown = require('widgets/dropdown');
const initFilePicker = require('widgets/filepicker');
const { translate } = require('lib/i18n');

let ractive;

function open() {

  ractive = new Ractive({
    partials: {
      content: require('./_content.ract'),
    },
    data: {
      isLoading: false,
      isInited: false,
      step: 1,
      hasTwoSides: false,
    },
  });

  let countryPicker;
  let documentTypePicker;
  let documentPicker;
  let documentFrontPicker;
  let documentBackPicker;

  const allDocumentTypes = [
    { code: 'passport', name: translate('Passport') },
    { code: 'national_identity_card', name: translate('National identity card') },
    { code: 'driving_licence', name: translate('Driving licence') },
  ];

  let existingFile;

  Promise.all([
    moonpay.getFiles(),
    moonpay.getCountries('document').length === 0 ? moonpay.loadCountries('document') : Promise.resolve(),
  ]).then((results) => {
    ractive.set('isInited', true);

    let selectedCountry = moonpay.getIpCountry();
    let selectedType;

    existingFile = getValidDocumentFile(results[0]);
    if (existingFile) {
      selectedCountry = existingFile.country;
      selectedType = existingFile.type;
    }

    const countries = moonpay.getCountries('document');
    countryPicker = initDropdown(ractive.find('#moonpay_document_country'), countries, selectedCountry);
    renderDocumentTypePicker(selectedCountry, selectedType);
    countryPicker.on('on-change', () => {
      renderDocumentTypePicker(countryPicker.getValue());
    });
  }).catch(console.error);

  function renderDocumentTypePicker(code, selectedType) {
    const countries = moonpay.getCountries('document');
    const country = code ? countries.find((country) => { return country.code === code; }) : countries[0];
    if (country && country.supportedDocuments) {
      const options = allDocumentTypes.filter((item) => {
        return country.supportedDocuments.indexOf(item.code) !== -1;
      });
      documentTypePicker = initDropdown(ractive.find('#moonpay_document_document_type'), options, selectedType);
    } else {
      documentTypePicker = initDropdown(ractive.find('#moonpay_document_document_type'), []);
    }
  }

  ractive.on('continue', () => {
    ractive.set('step', 2);
    const type = documentTypePicker.getValue();
    const hasTwoSides = type === 'national_identity_card' || type === 'driving_licence';
    ractive.set('hasTwoSides', hasTwoSides);

    let filename = '';
    // eslint-disable-next-line max-len
    if (existingFile && existingFile.type === documentTypePicker.getValue() && existingFile.country === countryPicker.getValue()) {
      filename = 'document';
    }

    if (hasTwoSides) {
      documentFrontPicker = initFilePicker(ractive.find('#moonpay_document_front_widget'), {
        id: 'moonpay_document_front',
        filename,
      });
      documentBackPicker = initFilePicker(ractive.find('#moonpay_document_back_widget'), {
        id: 'moonpay_document_back',
        filename,
      });
    } else {
      documentPicker = initFilePicker(ractive.find('#moonpay_document_widget'), {
        id: 'moonpay_document',
        filename,
      });
    }
  });

  ractive.on('back', () => {
    ractive.set('step', 1);
  });

  ractive.on('submit', () => {
    ractive.set('isLoading', true);
    const type = documentTypePicker.getValue();
    const country = countryPicker.getValue();

    if (ractive.get('hasTwoSides')) {
      const front = documentFrontPicker.getFile();
      const back = documentBackPicker.getFile();
      if (!front || !back) return handleError(new Error('Please fill out all fields.'));
      return Promise.all([
        moonpay.uploadFile(front, type, country, 'front'),
        moonpay.uploadFile(back, type, country, 'back'),
      ]).then(() => {
        ractive.fire('cancel');
      }).catch((err) => {
        if (/File upload is disabled due to identity check status/.test(err.message)) {
          return handleError(new Error('File upload is disabled due to identity check status'));
        }
        console.error(err);
        return handleError(new Error('Upload failed. Please try again later.'));
      });
    } else {
      const document = documentPicker.getFile();
      if (!document) return handleError(new Error('Please fill out all fields.'));
      return moonpay.uploadFile(document, type, country).then(() => {
        ractive.fire('cancel');
      }).catch((err) => {
        if (/File upload is disabled due to identity check status/.test(err.message)) {
          return handleError(new Error('File upload is disabled due to identity check status'));
        }
        console.error(err);
        return handleError(new Error('Upload failed. Please try again later.'));
      });
    }
  });

  function getValidDocumentFile(files) {
    files = files.filter((item) => {
      return ['passport', 'national_identity_card', 'driving_licence'].indexOf(item.type) !== -1;
    });
    if (files.length === 0) return false;
    if (files.length === 1 && files[0].type === 'passport') return files[0];
    // eslint-disable-next-line max-len
    if (files.length === 2 && files[0].type === files[1].type && ['national_identity_card', 'driving_licence'].indexOf(files[0].type) !== -1) {
      return files[0];
    }
    return false;
  }

  function handleError(err) {
    ractive.set('isLoading', false);
    showError({ message: err.message });
  }

  return ractive;
}

module.exports = open;
