'use strict';

var Ractive = require('widgets/modals/base');
var translate = require('lib/i18n').translate;

module.exports = function showTooltip(data) {

  if (!data.isTranslated) {
    data.message = translate(data.message, data.interpolations);
  }

  var ractive = new Ractive({
    el: document.getElementById('tooltip'),
    partials: {
      content: require('./content.ract'),
    },
    data: data,
  });

  ractive.on('close', function() {
    ractive.fire('cancel');
  });

  return ractive;
};
