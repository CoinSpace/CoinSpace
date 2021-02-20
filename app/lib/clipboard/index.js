'use strict';

const { translate } = require('lib/i18n');
const Clipboard = require('clipboard');

function init(ractive, selector, variable) {
  if (!Clipboard.isSupported()) return;
  const clipboard = new Clipboard(ractive.find(selector));
  clipboard.on('success', () => {
    const origin = ractive.get(variable);
    ractive.set(variable, translate('Copied!'));
    setTimeout(() => ractive.set(variable, origin), 1000);
  });
  return clipboard;
}

module.exports = init;
