'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const initHeader = require('widgets/header');
const initTabs = require('widgets/tabs');
const initSidebar = require('widgets/sidebar');
const initTerms = require('widgets/terms');
const initSend = require('pages/send');
const initReceive = require('pages/receive');
const initExchange = require('pages/exchange');
const initHistory = require('pages/history');
const initTokens = require('pages/tokens');
const Hammer = require('hammerjs');

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
  });

  // widgets
  const header = initHeader(ractive.find('#header'));
  initTabs(ractive.find('#tabs'));
  initSidebar(ractive.find('#sidebar'));
  initTerms(ractive.find('#terms'));

  // tabs
  const tabs = {
    send: initSend(ractive.find('#send')),
    receive: initReceive(ractive.find('#receive')),
    exchange: initExchange(ractive.find('#exchange')),
    history: initHistory(ractive.find('#history')),
    tokens: initTokens(ractive.find('#tokens')),
  };

  let currentPage = tabs.send;
  showPage(tabs.send);

  if (process.env.BUILD_TYPE === 'phonegap') {
    Hammer(ractive.find('#main'), { velocity: 0.1 }).on('swipeleft', () => {
      if (currentPage === tabs.send) {
        emitter.emit('change-tab', 'receive');
      } else if (currentPage === tabs.receive) {
        emitter.emit('change-tab', 'exchange');
      } else if (currentPage === tabs.exchange) {
        emitter.emit('change-tab', 'history');
      } else if (currentPage === tabs.history) {
        emitter.emit('change-tab', 'tokens');
      }
    });

    Hammer(ractive.find('#main'), { velocity: 0.1 }).on('swiperight', () => {
      if (currentPage === tabs.tokens) {
        emitter.emit('change-tab', 'history');
      } else if (currentPage === tabs.history) {
        emitter.emit('change-tab', 'exchange');
      } else if (currentPage === tabs.exchange) {
        emitter.emit('change-tab', 'receive');
      } else if (currentPage === tabs.receive) {
        emitter.emit('change-tab', 'send');
      }
    });
  }

  emitter.on('change-tab', (tab) => {
    const page = tabs[tab];
    showPage(page);
  });

  emitter.on('toggle-terms', (open) => {
    const classes = ractive.find('#main').classList;
    if (open) {
      classes.add('terms-open');
      classes.add('closed');
    } else {
      classes.remove('terms-open');
      classes.remove('closed');
    }
  });

  function showPage(page) {
    currentPage.hide();
    page.show();
    currentPage = page;
  }

  // menu toggle
  emitter.on('toggle-menu', (open) => {
    const classes = ractive.find('#main').classList;
    if (open) {
      ractive.set('sidebar_open', true);
      classes.add('closed');
    } else {
      ractive.set('sidebar_open', false);
      classes.remove('closed');
    }

    header.toggleIcon(open);
  });

  emitter.on('wallet-block', () => {
    emitter.emit('change-tab', 'tokens');
    document.getElementsByTagName('html')[0].classList.add('blocked');
  });

  emitter.on('wallet-unblock', () => {
    document.getElementsByTagName('html')[0].classList.remove('blocked');
  });

  return ractive;
};
