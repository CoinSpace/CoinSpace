'use strict';

const Ractive = require('widgets/modals/base');
const { getAvatar } = require('lib/avatar');
const geo = require('lib/geo');
const { showError } = require('widgets/modals/flash');
const animatePin = require('lib/transitions/pinDrop.js').drop;
const resetPin = require('lib/transitions/pinDrop.js').reset;

function open(network, callback) {
  const ractive = new Ractive({
    template: require('./index.ract'),
    data: {
      exchangeRates: {},
      nearbys: [],
      searching: true,
      searchingAgain: false,
      getAvatar,
      search_message: 'Searching your area for other Coin users',
    },
    oncomplete() {
      const pinEl = ractive.find('#geo-pin');
      const pulseEl = ractive.find('#geo-pulse');
      resetPin(pinEl, () => {
        animatePin(pinEl, pulseEl);
      });
      lookupGeo('new');
    },
  });

  ractive.on('select', (context) => {
    context.original.preventDefault();
    const address = context.node.getAttribute('data-wallet');
    callback(address);
    ractive.fire('cancel');
  });

  ractive.on('search-again', () => {
    if (ractive.get('searchingAgain')) return false;
    ractive.set('searchingAgain', true);
    lookupGeo();
  });

  ractive.on('close', () => {
    ractive.fire('cancel');
  });

  async function lookupGeo(context) {
    if (context === 'new') {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    } else {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    geo.search(network, (err, results) => {
      if (err) {
        ractive.set('searching', false);
        ractive.set('searchingAgain', false);
        return showError({ message: err.message });
      }
      ractive.set('searching', false);
      ractive.set('searchingAgain', false);
      setNearbys(results);
    });
  }

  function setNearbys(results) {
    let nearbys;
    if (results == null || results.length < 1) {
      nearbys = [];
    } else {
      nearbys = results.map((record) => {
        return record[0];
      });
    }
    ractive.set('nearbys', nearbys);
  }

  return ractive;
}

module.exports = open;
