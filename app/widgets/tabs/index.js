'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
  });

  const tabElements = {
    send: '#send_tab',
    receive: '#receive_tab',
    exchange: '#exchange_tab',
    history: '#history_tab',
    tokens: '#tokens_tab',
  };
  let active;
  function highlightTab(node) {
    if (node !== active && active && active.classList.contains('active')) {
      active.classList.remove('active');
    }
    node.classList.add('active');
    active = node;
  }

  emitter.once('wallet-ready', () => {
    highlightTab(ractive.find(tabElements.send));
  });

  emitter.on('change-tab', (tab) => {
    highlightTab(ractive.find(tabElements[tab]));
  });

  ractive.on('select', (context)=> {
    context.original.preventDefault();
    emitter.emit('change-tab', context.node.dataset.tab);
    highlightTab(context.node);
  });

  return ractive;
};
