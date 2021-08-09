import Ractive from 'lib/ractive';
import emitter from 'lib/emitter';
import details from 'lib/wallet/details';
import tokens from 'lib/tokens';
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
    },
  });

  function search() {
    const walletTokens = details.get('tokens');
    const cryptoTokens = tokens.search(ractive.get('searchQuery'))
      .filter((item) => !walletTokens.find((token) => token._id === item._id && token.network === item.network));
    ractive.set('show', PER_PAGE);
    ractive.set('cryptoTokens', cryptoTokens);
  }

  function addToken(id, network) {
    const token = tokens.getTokenById(id, network);
    const walletTokens = details.get('tokens');

    walletTokens.push(token);

    details.set('tokens', walletTokens)
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        emitter.emit('set-tokens', 'list');
        emitter.emit('token-added', token);
      });
  }

  ractive.on('before-show', () => {
    ractive.set('searchQuery', null);
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
