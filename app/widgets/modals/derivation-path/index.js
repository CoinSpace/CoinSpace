import Ractive from 'widgets/modals/base';
import { translate } from 'lib/i18n';
import request from 'lib/request';
import { getWallet, reloadCrypto } from 'lib/wallet';
import details from 'lib/wallet/details';
import { showError } from 'widgets/modals/flash';
import content from './_content.ract';

const BIPS = {
  p2pkh: 'bip44',
  p2sh: 'bip49',
  p2wpkh: 'bip84',
};

export default function open() {
  const wallet = getWallet();
  const settings = wallet.addressTypes.map((type) => {
    return {
      type,
      bip: BIPS[type],
      path: wallet.settings[BIPS[type]],
    };
  });

  const ractive = new Ractive({
    partials: {
      content,
    },
    data: {
      settings,
    },
    getAddressTypeOption(type) {
      if (type === 'p2pkh') return translate('P2PKH - Legacy');
      if (type === 'p2sh') return translate('P2SH - SegWit compatible');
      if (type === 'p2wpkh') return translate('Bech32 - SegWit native');
    },
    clearSetting(type) {
      const settings = ractive.get('settings');
      for (const setting of settings) {
        if (setting.type === type) {
          setting.path = '';
        }
      }
      ractive.set('settings', settings);
      ractive.find(`#setting-${type}`).focus();
    },
  });

  ractive.on('save', async () => {
    ractive.set('isLoading', true);
    if (ractive.get('settings').some((item) => wallet.settings[item.bip] !== item.path)) {
      const settings = {};
      for (const setting of ractive.get('settings')) {
        if (!/^m(\/\d+'?)+$/.test(setting.path)) {
          ractive.set('isLoading', false);
          return showError({
            message: translate('Invalid path :path', {
              path: setting.path,
            }),
          });
        }
        settings[setting.bip] = setting.path;
      }
      try {
        await reloadCrypto(settings);
        await details.setCryptoSettings(wallet.crypto._id, settings);
        await request({
          baseURL: process.env.SITE_URL,
          url: 'api/v3/logout/others',
          method: 'post',
          seed: 'public',
        });
      } catch (err) {
        if (err.message !== 'cancelled') {
          console.error(err);
        }
      }
    }
    ractive.fire('cancel');
    ractive.set('isLoading', false);
  });

  return ractive;
}
