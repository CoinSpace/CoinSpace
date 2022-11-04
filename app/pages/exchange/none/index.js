import Ractive from 'lib/ractive';
import emitter from 'lib/emitter';
import moonpay from 'lib/moonpay';
import ramps from 'lib/ramps';
import { getWallet } from 'lib/wallet';
import template from './index.ract';
import loader from 'partials/loader/loader.ract';
import CountryList from 'country-list';
import initDropdown from 'widgets/dropdown';

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
      symbol: '',
      buyRamps: [],
      sellRamps: [],
      openRamp: (url) => {
        window.safeOpen(url, '_blank');
      },
    },
  });

  const countryList = CountryList.getData().sort((a, b) => {
    return a.name.localeCompare(b.name);
  }).map((item) => {
    return {
      value: item.code,
      name: item.name,
    };
  });

  countryList.unshift({ value: '', name: '–' });
  const countryOfResidence = initDropdown({
    el: ractive.find('#js-country-of-residence'),
    options: countryList,
    value: '',
    id: 'country-of-residence',
  });

  ractive.on('before-show', async () => {
    if (ractive.get('isLoading')) return;
    ractive.set('isLoading', true);
    const wallet = getWallet();
    ractive.set('symbol', wallet.crypto.symbol);
    await moonpay.init();
    await setDefaultCountryOfResidence();
    await loadRamps();
    ractive.set('isLoading', false);
  });

  countryOfResidence.on('on-change', async () => {
    ractive.set('isLoading', true);
    await loadRamps();
    ractive.set('isLoading', false);
  });

  async function setDefaultCountryOfResidence() {
    if (countryOfResidence.getValue() === '') {
      countryOfResidence.set('value', moonpay.getCountryCode() || '');
    }
  }

  async function loadRamps() {
    const wallet = getWallet();
    try {
      const { buy, sell } = await ramps.load(countryOfResidence.getValue(), wallet.crypto, wallet.getNextAddress());
      ractive.set('buyRamps', buy);
      ractive.set('sellRamps', sell);
    } catch (err) {
      console.error(err);
    }
  }

  function choose(exchangeName) {
    emitter.emit('set-exchange', exchangeName);
  }

  return ractive;
}
