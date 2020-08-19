'use strict';

const Ractive = require('widgets/modals/base');
const { translate } = require('lib/i18n');

module.exports = function showTooltip(data) {

  if (!data.isTranslated) {
    data.message = translate(data.message, data.interpolations);
  }

  const ractive = new Ractive({
    el: document.getElementById('tooltip'),
    partials: {
      content: require('./content.ract'),
    },
    data,
  });

  ractive.on('close', () => {
    ractive.fire('cancel');
  });

  return ractive;
};
