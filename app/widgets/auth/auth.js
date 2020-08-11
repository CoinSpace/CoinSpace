'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const { showError } = require('widgets/modals/flash');
const { getTokenNetwork } = require('lib/token');
const { setToken } = require('lib/token');
const { onSyncDoneWrapper } = require('lib/wallet/utils');

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

    this.onSyncDone = onSyncDoneWrapper({
      before: () => {
        console.log('before opening');
        this.set('opening', false);
      },
      complete: () => {
        window.scrollTo(0, 0);
      },
      fail: (err) => {
        setToken(getTokenNetwork()); // fix wrong tokens
        if (err.message === 'user_deleted') {
          return location.reload();
        }

        emitter.emit('clear-pin');

        if (err.message === 'auth_failed') {
          return showError({ message: 'Your PIN is incorrect' });
        }
        console.error(err);
        return showError({ message: err.message });
      },
    });
    this.getTokenNetwork = getTokenNetwork;
  },
});

module.exports = Auth;
