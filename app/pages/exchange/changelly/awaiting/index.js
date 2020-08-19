'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const { showInfo } = require('widgets/modals/flash');

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {},
    partials: {
      footer: require('../footer.ract'),
    },
  });

  const delay = 60 * 1000; // 60 seconds
  let interval;

  ractive.on('before-show', (context) => {
    if (context.status === 'hold') {
      showInfo({
        isHtml: true,
        title: 'On hold...',
        message: 'Currently, your transaction (ID: :id) is on hold.<br>Please, contact Changelly to pass KYC.',
        href: 'mailto:security@changelly.com',
        linkText: 'security@changelly.com',
        interpolations: {
          id: context.id,
        },
      });
    }

    interval = setInterval(() => {
      emitter.emit('changelly');
    }, delay);
  });

  ractive.on('before-hide', () => {
    clearInterval(interval);
  });

  return ractive;
};
