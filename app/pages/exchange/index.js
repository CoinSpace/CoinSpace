import Ractive from 'lib/ractive';
import emitter from 'lib/emitter';
import initChangelly from './changelly';
import initNone from './none';
import template from './index.ract';
import { getWallet } from 'lib/wallet';
import initEosSetup from 'widgets/eos/setup';
import initDeletedCrypto from 'widgets/deleted-crypto';

export default function(el) {
  const ractive = new Ractive({
    el,
    template,
    data: {
      needToSetupEos: false,
      isDeletedCrypto: false,
    },
  });

  initEosSetup(ractive.find('#eos-setup'));
  initDeletedCrypto(ractive.find('#deleted-crypto'));

  const exchanges = {
    changelly: initChangelly(ractive.find('#exchange_changelly')),
    none: initNone(ractive.find('#exchange_none')),
  };

  let currentExchange = exchanges.none;

  ractive.on('before-show', () => {
    const wallet = getWallet();
    ractive.set('needToSetupEos', wallet.crypto.platform === 'eos' && !wallet.isActive);
    ractive.set('isDeletedCrypto', wallet.crypto.platform === 'bitcoin-sv');

    if (process.env.BUILD_PLATFORM === 'mas') return showExchange(exchanges.none);

    const preferredExchange = window.localStorage.getItem('_cs_preferred_exchange');
    if (exchanges[preferredExchange]) {
      showExchange(exchanges[preferredExchange]);
    } else {
      showExchange(exchanges.none);
    }
  });

  ractive.on('before-hide', () => {
    currentExchange.hide();
  });

  emitter.on('set-exchange', (exchangeName) => {
    window.localStorage.setItem('_cs_preferred_exchange', exchangeName);
    showExchange(exchanges[exchangeName]);
  });

  function showExchange(exchange) {
    setTimeout(() => {
      currentExchange.hide();
      exchange.show();
      currentExchange = exchange;
    });
  }

  return ractive;
}
