'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const details = require('lib/wallet/details');
const tokens = require('lib/tokens');
const addCustomToken = require('widgets/modals/add-custom-token');

const PER_PAGE = 10;

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      searchQuery: null,
      ethereumTokens: [],
      show: PER_PAGE,
      addToken,
    },
  });

  function addToken(id) {
    const token = tokens.getTokenById(id);
    const walletTokens = details.get('tokens');

    walletTokens.push(token);

    details.set('tokens', walletTokens)
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        emitter.emit('set-tokens', 'list');
      });
  }

  ractive.on('before-show', () => {
    ractive.set('searchQuery', null);
    ractive.set('ethereumTokens', tokens.search());
    window.scrollTo(0, 0);
  });

  function search() {
    ractive.set('show', PER_PAGE);
    ractive.set('ethereumTokens', tokens.search(ractive.get('searchQuery')));
  }

  ractive.on('back', () => {
    emitter.emit('set-tokens', 'list');
  });

  ractive.on('clearQuery', () => {
    ractive.set('searchQuery', null);
    ractive.find('#search_token').focus();
    search();
  });

  ractive.on('inputQuery', () => {
    search();
  });

  ractive.on('loadMore', () => {
    ractive.set('show', ractive.get('show') + PER_PAGE);
  });

  ractive.on('addCustomToken', () => {
    addCustomToken();
  });

  return ractive;
};
