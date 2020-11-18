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
  success: {
    success: true,
    title: 'Success!',
  },
};

let isOpen = false;

function openModal(type, data) {
  if (isOpen) return;
  isOpen = true;
  data = data || {};
  data.error = defaults[type].error;
  data.warning = defaults[type].warning;
  data.success = defaults[type].success;
  data.title = data.title || defaults[type].title;
  data.type = type;

  if (data.href && data.linkTextI18n) {
    data.linkText = translate(data.linkTextI18n);
  }

  data.onDismiss = function() {
    isOpen = false;
  };

  const ractive = new Ractive({
    el: data.el || document.getElementById('flash-modal'),
    partials: {
      content: require('./content.ract'),
    },
    data,
  });

  return ractive;
}

function showError(data) {
  if (data.message === 'Network Error') {
    data.message = 'Request timeout. Please check your internet connection.';
  }
  return openModal('error', data);
}

function showInfo(data) {
  return openModal('info', data);
}

function showSuccess(data) {
  return openModal('success', data);
}

module.exports = {
  showError,
  showInfo,
  showSuccess,
};
