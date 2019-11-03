'use strict';

var Ractive = require('widgets/modals/base');
var showError = require('widgets/modals/flash').showError;
var moonpay = require('lib/moonpay');
var initFilePicker = require('widgets/filepicker');

var ractive;

function open() {

  ractive = new Ractive({
    partials: {
      content: require('./_content.ract')
    },
    data: {
      isLoading: false,
      isInited: false
    }
  });

  var filePicker;

  moonpay.getFiles().then(function(files) {
    var file = files.find(function(item) {
      return item.type === 'selfie';
    })
    ractive.set('isInited', true);
    filePicker = initFilePicker(ractive.find('#moonpay_selfie_widget'), {
      id: 'moonpay_selfie',
      filename: file ? file.type : ''
    });
  }).catch(console.error);

  ractive.on('submit', function() {
    ractive.set('isLoading', true);
    var file = filePicker.getFile();
    if (!file) return handleError(new Error('Please fill out all fields.'));

    return moonpay.uploadFile(file, 'selfie', moonpay.getIpCountry()).then(function() {
      ractive.fire('cancel');
    }).catch(function(err) {
      console.error(err);
      return handleError(new Error('Upload failed. Please try again later.'));
    });
  });

  function handleError(err) {
    ractive.set('isLoading', false);
    showError({message: err.message});
  }

  return ractive;
}

module.exports = open;
