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
      ethereumTokens: [],
      show: PER_PAGE,
      addToken,
    },
  });

  function search() {
    const walletTokenIds = details.get('tokens').map(item => item._id);
    const ethereumTokens = tokens.search(ractive.get('searchQuery'))
      .filter(item => !walletTokenIds.includes(item._id));
    ractive.set('show', PER_PAGE);
    ractive.set('ethereumTokens', ethereumTokens);
  }

  function addToken(id) {
    const token = tokens.getTokenById(id);
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
