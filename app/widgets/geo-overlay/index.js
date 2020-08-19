'use strict';

const Ractive = require('lib/ractive');
const { getAvatar } = require('lib/avatar');
const emitter = require('lib/emitter');
const geo = require('lib/geo');
const { showError } = require('widgets/modals/flash');
const { fadeIn } = require('lib/transitions/fade.js');
const { fadeOut } = require('lib/transitions/fade.js');
const animatePin = require('lib/transitions/pinDrop.js').drop;
const resetPin = require('lib/transitions/pinDrop.js').reset;

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      exchangeRates: {},
      nearbys: [],
      searching: true,
      getAvatar,
      context: '',
      network: null,
    },
  });

  emitter.on('open-overlay', (data) => {
    if (data.overlay === 'geo') {
      ractive.set('searching', true);
      fadeIn(ractive.find('.js__fadeEl'), () => {
        ractive.set({
          context: data.context,
          network: data.network,
          search_message: 'Searching your area for other Coin users',
        });
        ractive.fire('search-nearby');
      });
    }
  });

  ractive.on('select', (context)=> {
    context.original.preventDefault();
    const address = context.node.getAttribute( 'data-wallet' );
    emitter.emit('prefill-wallet', address, ractive.get('context'));
    ractive.fire('close-geo');
  });

  ractive.on('search-nearby', ()=> {
    const pinEl = ractive.find('#geo-pin');
    const pulseEl = ractive.find('#geo-pulse');
    resetPin(pinEl, () => {
      animatePin(pinEl, pulseEl);
    });
    lookupGeo('new');
  });

  ractive.on('search-again', () => {
    if (ractive.get('searchingAgain')) return false;
    ractive.set('searchingAgain', true);
    ractive.find('#refresh_el').classList.add('loading');
    lookupGeo();
  });

  ractive.on('close-geo', ()=> {
    fadeOut(ractive.find('.js__fadeEl'), ()=> {
      if (ractive.get('searching')) {
        const pinEl = ractive.find('#geo-pin');
        resetPin(pinEl);
      }
      ractive.set('nearbys', []);
      ractive.set('searching', false);
      emitter.emit('close-overlay');
    });
  });

  function lookupGeo(context) {
    geo.search(ractive.get('network'), (err, results) => {

      if (ractive.get('searchingAgain')) {
        // wait for spinner to spin down
        setTimeout(()=> {
          ractive.set('searchingAgain', false);
          cancelSpinner();
        }, 1000);
      }

      if (err) {
        cancelSpinner();
        return showError({
          message: err.message,
        }).on('cancel', () => {
          ractive.fire('close-geo');
        });
      }

      if (context === 'new') {
        // set a brief timeout so it "feels" like we're searching
        setTimeout(()=> {
          setNearbys(results);
          const pinEl = ractive.find('#geo-pin');
          resetPin(pinEl);
          ractive.set('searching', false);
        }, 1500);
      } else {
        setNearbys(results);
      }
    });
  }

  function setNearbys(results) {
    let nearbys;

    if (results == null || results.length < 1) {
      nearbys = [];
    } else {
      nearbys = results.map((record)=> {
        return record[0];
      });
    }

    ractive.set('nearbys', nearbys);
  }

  function cancelSpinner() {
    if (!ractive.find('#refresh_el')) return ractive;
    const refreshEl = ractive.find('#refresh_el');
    refreshEl.classList.remove('loading');
  }

  return ractive;
};
