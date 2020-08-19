'use strict';

const Ractive = require('widgets/modals/base');
const { showError } = require('widgets/modals/flash');
const moonpay = require('lib/moonpay');
const initFilePicker = require('widgets/filepicker');

let ractive;

function open() {

  ractive = new Ractive({
    partials: {
      content: require('./_content.ract'),
    },
    data: {
      isLoading: false,
      isInited: false,
    },
  });

  let filePicker;

  moonpay.getFiles().then((files) => {
    const file = files.find((item) => {
      return item.type === 'selfie';
    });
    ractive.set('isInited', true);
    filePicker = initFilePicker(ractive.find('#moonpay_selfie_widget'), {
      id: 'moonpay_selfie',
      filename: file ? 'selfie' : '',
    });
  }).catch(console.error);

  ractive.on('submit', () => {
    ractive.set('isLoading', true);
    const file = filePicker.getFile();
    if (!file) return handleError(new Error('Please fill out all fields.'));

    return moonpay.uploadFile(file, 'selfie', moonpay.getIpCountry()).then(() => {
      ractive.fire('cancel');
    }).catch((err) => {
      if (/File upload is disabled due to identity check status/.test(err.message)) {
        return handleError(new Error('File upload is disabled due to identity check status'));
      }
      console.error(err);
      return handleError(new Error('Upload failed. Please try again later.'));
    });
  });

  function handleError(err) {
    ractive.set('isLoading', false);
    showError({ message: err.message });
  }

  return ractive;
}

module.exports = open;
