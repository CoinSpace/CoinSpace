'use strict';

var Ractive = require('lib/ractive');
var emitter = require('lib/emitter');
var showInfo = require('widgets/modals/flash').showInfo;

module.exports = function(el) {
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {},
    partials: {
      footer: require('../footer.ract')
    }
  });

  var delay = 60 * 1000; // 60 seconds
  var interval;

  ractive.on('before-show', function(context) {
    if (context.status === 'hold') {
      showInfo({
        isHtml: true,
        title: 'On hold...',
        message: 'Currently, your transaction (ID: :id) is on hold.<br>Please, contact Changelly to pass KYC.',
        href: 'mailto:security@changelly.com',
        linkText: 'security@changelly.com',
        interpolations: {
          id: context.id
        }
      });
    }

    interval = setInterval(function() {
      emitter.emit('changelly');
    }, delay);
  });

  ractive.on('before-hide', function() {
    clearInterval(interval);
  });

  return ractive;
}
