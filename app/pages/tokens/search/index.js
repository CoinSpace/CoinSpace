import Ractive from 'lib/ractive';
import emitter from 'lib/emitter';
import details from 'lib/wallet/details';
import { addPublicKey } from 'lib/wallet';
import LS from 'lib/wallet/localStorage';
import crypto from 'lib/crypto';
import addCustomToken from 'widgets/modals/add-custom-token';
import template from './index.ract';

const PER_PAGE = 10;

export default function(el) {
  const ractive = new Ractive({
    el,
    template,
    data: {
      searchQuery: null,
      cryptoTokens: [],
      show: PER_PAGE,
      addToken,
      getLogoUrl(logo) {
        return crypto.getLogoUrl(logo);
      },
    },
  });
  let isLoading = false;

  function search() {
    const walletTokens = details.get('tokens');
    const cryptoTokens = crypto.searchTokens(ractive.get('searchQuery'))
      .filter((item) => !walletTokens.find((token) => token._id === item._id));
    ractive.set('show', PER_PAGE);
    ractive.set('cryptoTokens', cryptoTokens);
  }

  async function addToken(id) {
    if (isLoading) return;
    isLoading = true;
    const token = crypto.getTokenById(id);
    if (!LS.hasPublicKey(token.platform)) {
      try {
        await addPublicKey(token);
      } catch (err) {
        return isLoading = false;
      }
    }
    const walletTokens = details.get('tokens');
    walletTokens.push(token);

    details.set('tokens', walletTokens)
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        isLoading = false;
        emitter.emit('set-tokens', 'list');
        emitter.emit('token-added', token);
      });
  }

  ractive.on('before-show', () => {
    ractive.set('searchQuery', null);
    isLoading = false;
    search();
    window.scrollTo(0, 0);
  });

  ractive.on('back', () => {
    emitter.emit('set-tokens', 'list');
  });

  ractive.on('clearQuery', () => {
    ractive.set('searchQuery', null);
    ractive.find('#search_token').focus();
    search();
  });

  ractive.on('inputQuery', () => {
    search();
  });

  ractive.on('loadMore', () => {
    ractive.set('show', ractive.get('show') + PER_PAGE);
  });

  ractive.on('addCustomToken', () => {
    addCustomToken();
  });

  return ractive;
}
