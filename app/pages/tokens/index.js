'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const initList = require('./list');
const initSearch = require('./search');
const tokens = require('lib/tokens');
const { getCrypto, setCrypto } = require('lib/crypto');
const { initWallet } = require('lib/wallet');

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      isLoading: true,
    },
    partials: {
      loader: require('partials/loader/loader.ract'),
    },
  });

  const pages = {
    list: initList(ractive.find('#tokens-list')),
    search: initSearch(ractive.find('#tokens-search')),
  };

  let currentPage = pages.list;

  ractive.on('before-show', async () => {
    await tokens.init();
    ractive.set('isLoading', false);
    showPage(pages.list);
  });

  ractive.on('before-hide', () => {
    currentPage.hide();
  });

  emitter.on('set-tokens', (page) => {
    showPage(pages[page]);
  });

  emitter.on('token-added', (crypto) => {
    setCrypto(crypto);
    ractive.set('currentCrypto', getCrypto());
    emitter.emit('sync');

    setTimeout(() => {
      initWallet();
    }, 200);
  });

  function showPage(page) {
    setTimeout(() => {
      currentPage.hide();
      page.show();
      currentPage = page;
    });
  }

  return ractive;
};
