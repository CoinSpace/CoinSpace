'use strict';

const Ractive = require('widgets/modals/base');
const { translate } = require('lib/i18n');

const defaults = {
  error: {
    error: true,
    title: 'Whoops!',
  },
  info: {
    warning: true,
    title: 'Just saying...',
  },
};

let isOpen = false;

function openModal(type, data) {
  if (isOpen) return;
  isOpen = true;
  data = data || {};
  data.error = defaults[type].error;
  data.warning = defaults[type].warning;
  data.title = data.title || defaults[type].title;
  data.type = type;

  if (data.href && data.linkTextI18n) {
    data.linkText = translate(data.linkTextI18n);
  }

  data.onDismiss = function() {
    isOpen = false;
  };

  const ractive = new Ractive({
    el: document.getElementById('flash-modal'),
    partials: {
      content: require('./content.ract'),
    },
    data,
  });

  ractive.on('close', ()=> {
    ractive.fire('cancel');
  });

  return ractive;
}

function showError(data) {
  if (data.message === 'Network Error') {
    data.message = 'Request timeout. Please check your internet connection.';
  } else if (data.message.search(/is not a valid address$/)) {
    data = Object.assign(data, {
      message: 'address is not a valid address.',
      interpolations: {
        address: data.message.match(/^(.*) is not a valid address$/)[1],
      },
    });
  }
  return openModal('error', data);
}

function showInfo(data) {
  return openModal('info', data);
}

module.exports = {
  showError,
  showInfo,
};
