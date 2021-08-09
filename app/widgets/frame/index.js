import Ractive from 'lib/ractive';
import emitter from 'lib/emitter';
import initHeader from 'widgets/header';
import initTabs from 'widgets/tabs';
import initSend from 'pages/send';
import initReceive from 'pages/receive';
import initExchange from 'pages/exchange';
import initHistory from 'pages/history';
import initTokens from 'pages/tokens';
import showSettings from 'widgets/settings';
import { showError } from 'widgets/modals/flash';
import { setCrypto } from 'lib/crypto';
import { getWalletCoin } from 'lib/wallet';
import Hammer from 'hammerjs';
import template from './index.ract';
import { translate } from 'lib/i18n';

export default function(el) {
  const ractive = new Ractive({
    el,
    template,
    data: {
      isSettingsShown: false,
    },
  });

  // widgets
  const header = initHeader(ractive.find('#header'));
  header.on('show-settings', () => {
    ractive.set('isSettingsShown', true);
    const settings = showSettings(ractive.find('#settings'));
    if (process.env.BUILD_PLATFORM === 'ios') window.StatusBar.setStyle('default');
    settings.on('back', () => {
      ractive.set('isSettingsShown', false);
      if (process.env.BUILD_PLATFORM === 'ios') window.StatusBar.setStyle('lightContent');
    });
    window.scrollTo(0, 0);
  });

  initTabs(ractive.find('#tabs'));

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

  function showPage(page) {
    currentPage.hide();
    page.show();
    currentPage = page;
  }

  ractive.on('before-show', () => {
    if (process.env.BUILD_PLATFORM === 'ios') window.StatusBar.setStyle('lightContent');
  });

  emitter.on('wallet-ready', () => {
    document.getElementsByTagName('html')[0].classList.remove('blocked');
  });

  emitter.on('wallet-error', (err) => {
    if (err.message === 'cs-node-error') {
      emitter.emit('change-tab', 'tokens');
      document.getElementsByTagName('html')[0].classList.add('blocked');
      showError({
        message: translate("Can't connect to :network node. Please try again later or choose another token.", {
          network: getWalletCoin().name,
        }),
      });
    } else {
      console.error(`not translated error: ${err.message}`);
      setCrypto(); // fix wrong tokens
      showError({ message: err.message });
    }
  });

  return ractive;
}
