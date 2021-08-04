import Ractive from 'widgets/modals/base';
import { translate } from 'lib/i18n';
import content from './content.ract';

const defaults = {
  error: {
    error: true,
    title: translate('Whoops!'),
    buttonText: translate('OK'),
  },
  info: {
    warning: true,
    title: translate('Just saying...'),
    buttonText: translate('OK'),
  },
  success: {
    success: true,
    title: translate('Success!'),
    buttonText: translate('OK'),
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
  data.buttonText = data.buttonText || defaults[type].buttonText;
  data.type = type;

  data.onDismiss = function() {
    isOpen = false;
  };

  const ractive = new Ractive({
    el: data.el || document.getElementById('flash-modal'),
    partials: {
      content,
    },
    data,
  });

  return ractive;
}

export function showError(data) {
  if (data.message === 'Network Error') {
    data.message = translate('Request timeout. Please check your internet connection.');
  }
  return openModal('error', data);
}

export function showInfo(data) {
  return openModal('info', data);
}

export function showSuccess(data) {
  return openModal('success', data);
}

export default {
  showError,
  showInfo,
  showSuccess,
};
