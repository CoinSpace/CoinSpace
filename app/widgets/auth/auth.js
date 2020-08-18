'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');

const Auth = Ractive.extend({
  el: document.getElementById("auth"),
  template: require('./index.ract'),
  partials: {
    header: require('./header.ract'),
    actions: require('./actions.ract'),
    content: require('./content.ract'),
    footer: require('./footer.ract'),
  },
  oninit() {
    this.set('opening', false);

    emitter.on('wallet-opening', (progress) => {
      this.set('progress', progress);
    });

    this.on('teardown', () => {
      emitter.removeAllListeners('wallet-opening');
    });
  },
});

module.exports = Auth;
