import Ractive from 'widgets/modals/base';
import { getAvatarUrl } from 'lib/avatar';
import geo from 'lib/geo';
import { showError } from 'widgets/modals/flash';
import { translate } from 'lib/i18n';
import { drop as animatePin } from 'lib/transitions/pinDrop.js';
import { reset as resetPin } from 'lib/transitions/pinDrop.js';
import template from './index.ract';

function open(callback) {
  const ractive = new Ractive({
    template,
    data: {
      nearbys: [],
      searching: true,
      searchingAgain: false,
      getAvatarUrl,
      search_message: translate('Searching your area for other Coin users'),
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

  async function lookupGeo(context) {
    if (context === 'new') {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    } else {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    try {
      const results = await geo.search();
      ractive.set('nearbys', results);
    } catch (err) {
      if (err.message === 'Your browser does not support geolocation') {
        showError({ message: translate('Your browser does not support geolocation') });
      } else if (err.message === 'Unable to retrieve your location') {
        showError({ message: translate('Unable to retrieve your location') });
      } else if (err.request) {
        showError({ message: translate('Request timeout. Please check your internet connection.') });
      } else {
        console.error(`not translated error: ${err.message}`);
        showError({ message: err.message });
      }
    }
    ractive.set('searching', false);
    ractive.set('searchingAgain', false);
  }

  return ractive;
}

export default open;
