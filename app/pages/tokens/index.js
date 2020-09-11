'use strict';

const Ractive = require('lib/ractive');
const showRemoveConfirmation = require('widgets/modals/confirm-remove');
const addEthereumToken = require('widgets/modals/add-ethereum-token');
const { setToken } = require('lib/token');
const { getToken } = require('lib/token');
const { initWallet } = require('lib/wallet');
const emitter = require('lib/emitter');
const details = require('lib/wallet/details');
const _ = require('lodash');

let walletTokens = [];
let isEnabled = false;
const tetherToken = {
  address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
  decimals: 6,
  name: 'Tether USD',
  network: 'ethereum',
  symbol: 'USDT',
  icon: 'svg_token_tether',
  isDefault: true,
};

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

  ractive.on('before-show', () => {
    walletTokens = details.get('walletTokens') || [];
    const ethereumTokens = walletTokens.filter((token) => {
      return token.network === 'ethereum';
    });
    ethereumTokens.unshift(tetherToken);
    ractive.set('ethereumTokens', ethereumTokens);
    ractive.set('currentToken', getToken());
  });

  function switchToken(token) {
    if (token === ractive.get('currentToken')) return;
    if (!isEnabled) return;
    const currentToken = ractive.get('currentToken');
    const currentTokenNetwork = currentToken.network || currentToken;

    const network = token.network || token;
    const baseUrl = window.location.href.split('?')[0];
    const url = baseUrl + '?network=' + network;

    ractive.set('currentToken', token);
    setToken(token);

    window.history.replaceState(null, null, url);
    document.getElementsByTagName('html')[0].classList.remove(currentTokenNetwork);
    document.getElementsByTagName('html')[0].classList.add(network);

    emitter.emit('sync');

    setTimeout(() => {
      initWallet();
    }, 200);
  }

  function removeEthereumToken(token) {
    const rindex = ractive.get('ethereumTokens').indexOf(token);
    showRemoveConfirmation(token.name, (modal) => {
      const index = walletTokens.indexOf(token);
      if (index === -1) return modal.fire('cancel');

      walletTokens.splice(index, 1);

      details.set('walletTokens', walletTokens).then(() => {
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

  ractive.on('add-ethereum-token', () => {
    addEthereumToken(walletTokens, (token) => {
      ractive.push('ethereumTokens', token);
    });
  });

  return ractive;
};
