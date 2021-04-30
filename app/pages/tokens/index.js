import Ractive from 'lib/ractive';
import emitter from 'lib/emitter';
import initList from './list';
import initSearch from './search';
import tokens from 'lib/tokens';
import { getCrypto, setCrypto } from 'lib/crypto';
import { initWallet } from 'lib/wallet';
import template from './index.ract';
import loader from 'partials/loader/loader.ract';

export default function(el) {
  const ractive = new Ractive({
    el,
    template,
    data: {
      isLoading: true,
    },
    partials: {
      loader,
    },
  });

  const pages = {
    list: initList(ractive.find('#tokens-list')),
    search: initSearch(ractive.find('#tokens-search')),
  };

  let currentPage = pages.list;

  ractive.on('before-show', async () => {
    await tokens.init();
    ractive.set('isLoading', false);
    showPage(pages.list);
  });

  ractive.on('before-hide', () => {
    currentPage.hide();
  });

  emitter.on('set-tokens', (page) => {
    showPage(pages[page]);
  });

  emitter.on('token-added', (crypto) => {
    setCrypto(crypto);
    ractive.set('currentCrypto', getCrypto());
    emitter.emit('sync');

    setTimeout(() => {
      initWallet();
    }, 200);
  });

  function showPage(page) {
    setTimeout(() => {
      currentPage.hide();
      page.show();
      currentPage = page;
    });
  }

  return ractive;
}
