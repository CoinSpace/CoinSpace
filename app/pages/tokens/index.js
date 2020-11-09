'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const initList = require('./list');
const initSearch = require('./search');
const initCustom = require('./custom');
const tokens = require('lib/tokens');
const details = require('lib/wallet/details');
const _ = require('lodash');

let _init;

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      isLoading: true,
    },
    partials: {
      loader: require('./loader.ract'),
    },
  });

  const pages = {
    list: initList(ractive.find('#tokens_list')),
    search: initSearch(ractive.find('#tokens_search')),
    custom: initCustom(ractive.find('#tokens_custom')),
  };

  let currentPage = pages.list;

  function init() {
    if (!_init) {
      _init = tokens.init()
        .then(() => {
          const walletTokens = details.get('tokens').map((walletToken) => {
            if (walletToken._id) {
              const current = tokens.getTokenById(walletToken._id);
              return current || walletToken;
            } else {
              const current = tokens.getTokenByAddress(walletToken.address);
              return current || walletToken;
            }
          });
          if (!_.isEqual(details.get('tokens'), walletTokens)) {
            return details.set('tokens', walletTokens);
          }
        })
        .catch((err) => {
          console.error(err);
        });
    }
    return _init;
  }

  ractive.on('before-show', async () => {
    await init();
    ractive.set('isLoading', false);
    showPage(pages.list);
  });

  ractive.on('before-hide', () => {
    currentPage.hide();
  });

  emitter.on('set-tokens', (page) => {
    showPage(pages[page]);
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
