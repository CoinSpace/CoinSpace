'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const moonpay = require('lib/moonpay');
const { getWallet } = require('lib/wallet');

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    partials: {
      loader: require('partials/loader/loader.ract'),
    },
    data: {
      isLoading: false,
      choose,
      crypto: '',
      moonpayBuyUrl: '',
      moonpaySellUrl: '',
    },
  });

  ractive.on('moonpay-buy', () => {
    window.safeOpen(ractive.get('moonpayBuyUrl'), '_blank');
  });

  ractive.on('moonpay-sell', () => {
    window.safeOpen(ractive.get('moonpaySellUrl'), '_blank');
  });

  ractive.on('before-show', async () => {
    if (ractive.get('isLoading')) return;
    ractive.set('isLoading', true);
    try {
      await moonpay.init();
      const wallet = getWallet();
      const symbol = wallet.denomination;
      ractive.set('crypto', wallet.name);
      const urls = await moonpay.getWidgetUrls(symbol, wallet.getNextAddress());
      ractive.set('moonpayBuyUrl', urls.buy);
      ractive.set('moonpaySellUrl', urls.sell);
    } catch (err) {
      console.error(err);
    }
    ractive.set('isLoading', false);
  });

  function choose(exchangeName) {
    emitter.emit('set-exchange', exchangeName);
  }

  return ractive;
};
