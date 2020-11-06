'use strict';

const Ractive = require('lib/ractive');
const showRemoveConfirmation = require('widgets/modals/confirm-remove');
const addEthereumToken = require('widgets/modals/add-ethereum-token');
const { getToken, setToken } = require('lib/token');
const { initWallet } = require('lib/wallet');
const emitter = require('lib/emitter');
const tokens = require('lib/tokens');
const details = require('lib/wallet/details');
const _ = require('lodash');

let isEnabled = false;

module.exports = function(el) {

  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      title: 'Available Tokens',
      id: 'token_dropdown',
      currentToken: '',
      isCurrentToken(token) {
        return _.isEqual(token, this.get('currentToken'));
      },
      switchToken,
      removeEthereumToken,
      ethereumTokens: [],
    },
  });

  emitter.on('sync', () => {
    isEnabled = false;
  });

  emitter.on('wallet-ready', () => {
    isEnabled = true;
  });

  ractive.on('before-show', async () => {
    try {
      const walletTokens = await Promise.all(details.get('tokens').map(async (walletToken) => {
        if (walletToken._id) {
          const current = await tokens.getTokenById(walletToken._id);
          return current || walletToken;
        } else {
          const current = await tokens.getTokenByAddress(walletToken.address);
          return current || walletToken;
        }
      }));
      if (!_.isEqual(details.get('tokens'), walletTokens)) {
        await details.set('tokens', walletTokens);
      }
    } catch (err) {
      console.error(err);
    }

    const walletTokens = details.get('tokens');
    ractive.set('ethereumTokens', walletTokens.filter(item => item.network === 'ethereum'));
    ractive.set('currentToken', getToken());
  });

  function switchToken(token) {
    if (token === ractive.get('currentToken')) return;
    if (!isEnabled) return;

    const network = token.network || token;
    const baseUrl = window.location.href.split('?')[0];
    const url = baseUrl + '?network=' + network;

    ractive.set('currentToken', token);
    setToken(token);

    window.history.replaceState(null, null, url);

    emitter.emit('sync');

    setTimeout(() => {
      initWallet();
    }, 200);
  }

  function removeEthereumToken(token) {
    const rindex = ractive.get('ethereumTokens').findIndex((item) => _.isEqual(item, token));
    const walletTokens = details.get('tokens');
    showRemoveConfirmation(token.name, (modal) => {
      const index = walletTokens.findIndex((item) => _.isEqual(item, token));
      if (index === -1) return modal.fire('cancel');

      walletTokens.splice(index, 1);

      details.set('tokens', walletTokens).then(() => {
        modal.set('onDismiss', () => {
          ractive.splice('ethereumTokens', rindex, 1);
        });
        modal.fire('cancel');
      }).catch((err) => {
        console.error(err);
        modal.fire('cancel');
      });
    });
    return false;
  }

  ractive.on('add-ethereum-token', (context) => {
    context.event.stopPropagation();
    addEthereumToken((token) => {
      ractive.push('ethereumTokens', token);
    });
  });

  return ractive;
};
