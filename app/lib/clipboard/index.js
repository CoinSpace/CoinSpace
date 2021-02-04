'use strict';

const { translate } = require('lib/i18n');
const Clipboard = require('clipboard');

function init(element) {
  if (!Clipboard.isSupported()) return;
  const clipboard = new Clipboard(element);
  clipboard.on('success', copyHandler);
  return clipboard;
}

function copyHandler({ trigger }) {
  const origin = trigger.innerHTML;
  trigger.innerHTML = translate('Copied!');
  setTimeout(() => trigger.innerHTML = origin, 1000);
}

module.exports = init;
