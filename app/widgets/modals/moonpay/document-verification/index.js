'use strict';

var Ractive = require('widgets/modals/base');
var showError = require('widgets/modals/flash').showError;
var moonpay = require('lib/moonpay');
var initDropdown = require('widgets/dropdown');
var initFilePicker = require('widgets/filepicker');
var translate = require('lib/i18n').translate;

var ractive;

function open() {

  ractive = new Ractive({
    partials: {
      content: require('./_content.ract')
    },
    data: {
      isLoading: false,
      isInited: false,
      step: 1,
      hasTwoSides: false
    }
  });

  var countryPicker;
  var documentTypePicker;
  var documentPicker;
  var documentFrontPicker;
  var documentBackPicker;

  var allDocumentTypes = [
    {code: 'passport', name: translate('Passport')},
    {code: 'national_identity_card', name: translate('National identity card')},
    {code: 'driving_licence', name: translate('Driving licence')},
  ];

  var existingFile;

  Promise.all([
    moonpay.getFiles(),
    moonpay.getCountries('document').length === 0 ? moonpay.loadCountries('document') : Promise.resolve()
  ]).then(function(results) {
    ractive.set('isInited', true);

    var selectedCountry = moonpay.getIpCountry();
    var selectedType;

    existingFile = getValidDocumentFile(results[0]);
    if (existingFile) {
      selectedCountry = existingFile.country;
      selectedType = existingFile.type;
    }

    var countries = moonpay.getCountries('document');
    countryPicker = initDropdown(ractive.find('#moonpay_document_country'), countries, selectedCountry);
    renderDocumentTypePicker(selectedCountry, selectedType);
    countryPicker.on('on-change', function() {
      renderDocumentTypePicker(countryPicker.getValue());
    });
  }).catch(console.error);

  function renderDocumentTypePicker(code, selectedType) {
    var countries = moonpay.getCountries('document');
    var country = code ? countries.find(function(country) { return country.code === code; }) : countries[0];
    if (country && country.supportedDocuments) {
      var options = allDocumentTypes.filter(function(item) {
        return country.supportedDocuments.indexOf(item.code) !== -1;
      });
      documentTypePicker = initDropdown(ractive.find('#moonpay_document_document_type'), options, selectedType);
    } else {
      documentTypePicker = initDropdown(ractive.find('#moonpay_document_document_type'), []);
    }
  }

  ractive.on('continue', function() {
    ractive.set('step', 2);
    var type = documentTypePicker.getValue();
    var hasTwoSides = type === 'national_identity_card' || type === 'driving_licence';
    ractive.set('hasTwoSides', hasTwoSides);

    var filename = '';
    if (existingFile && existingFile.type === documentTypePicker.getValue() && existingFile.country === countryPicker.getValue()) {
      filename = 'document';
    }

    if (hasTwoSides) {
      documentFrontPicker = initFilePicker(ractive.find('#moonpay_document_front_widget'), {
        id: 'moonpay_document_front',
        filename: filename
      });
      documentBackPicker = initFilePicker(ractive.find('#moonpay_document_back_widget'), {
        id: 'moonpay_document_back',
        filename: filename
      });
    } else {
      documentPicker = initFilePicker(ractive.find('#moonpay_document_widget'), {
        id: 'moonpay_document',
        filename: filename
      });
    }
  });

  ractive.on('back', function() {
    ractive.set('step', 1);
  });

  ractive.on('submit', function() {
    ractive.set('isLoading', true);
    var type = documentTypePicker.getValue();
    var country = countryPicker.getValue();

    if (ractive.get('hasTwoSides')) {
      var front = documentFrontPicker.getFile();
      var back = documentBackPicker.getFile();
      if (!front || !back) return handleError(new Error('Please fill out all fields.'));
      return Promise.all([
        moonpay.uploadFile(front, type, country, 'front'),
        moonpay.uploadFile(back, type, country, 'back')
      ]).then(function() {
        ractive.fire('cancel');
      }).catch(function(err) {
        if (/File upload is disabled due to identity check status/.test(err.message)) {
          return handleError(new Error('File upload is disabled due to identity check status'));
        }
        console.error(err);
        return handleError(new Error('Upload failed. Please try again later.'));
      });
    } else {
      var document = documentPicker.getFile();
      if (!document) return handleError(new Error('Please fill out all fields.'));
      return moonpay.uploadFile(document, type, country).then(function() {
        ractive.fire('cancel');
      }).catch(function(err) {
        if (/File upload is disabled due to identity check status/.test(err.message)) {
          return handleError(new Error('File upload is disabled due to identity check status'));
        }
        console.error(err);
        return handleError(new Error('Upload failed. Please try again later.'));
      });
    }
  });

  function getValidDocumentFile(files) {
    files = files.filter(function(item) {
      return ['passport', 'national_identity_card', 'driving_licence'].indexOf(item.type) !== -1;
    });
    if (files.length === 0) return false;
    if (files.length === 1 && files[0].type === 'passport') return files[0];
    if (files.length === 2 && files[0].type === files[1].type && ['national_identity_card', 'driving_licence'].indexOf(files[0].type) !== -1) {
      return files[0];
    }
    return false;
  }

  function handleError(err) {
    ractive.set('isLoading', false);
    showError({message: err.message});
  }

  return ractive;
}

module.exports = open;
