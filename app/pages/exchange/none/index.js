import Ractive from 'lib/ractive';
import emitter from 'lib/emitter';
import moonpay from 'lib/moonpay';
import { getWallet } from 'lib/wallet';
import template from './index.ract';
import loader from 'partials/loader/loader.ract';

export default function(el) {
  const ractive = new Ractive({
    el,
    template,
    partials: {
      loader,
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
}
