'use strict';

const Ractive = require('../auth');
const pinPage = require('../pin');

function confirm(prevPage, data) {
  const words = data.mnemonic.split(' ');
  const firstWord = words[data.randomIndexes[0]];
  const secondWord = words[data.randomIndexes[1]];

  const ractive = new Ractive({
    partials: {
      header: require('./header.ract'),
      actions: require('./actions.ract'),
      footer: require('./footer.ract'),
    },
    data: {
      passphrase: data.mnemonic,
      firstWord: '',
      secondWord: '',
      randomIndexes: data.randomIndexes,
      isCorrect() {
        return this.get('firstWord').trim() === firstWord && this.get('secondWord').trim() === secondWord;
      },
    },
  });

  ractive.on('clearWord', (context) => {
    const dataContext = context.node.getAttribute('data-context');
    if (dataContext === 'first-word') {
      ractive.set('firstWord', '');
      ractive.find('#first-word').focus();
    } else if (dataContext === 'second-word') {
      ractive.set('secondWord', '');
      ractive.find('#second-word').focus();
    }
  });

  ractive.on('back', () => {
    if (prevPage) prevPage();
  });

  ractive.on('confirm', () => {
    pinPage(prevPage, data);
  });

  return ractive;
}

module.exports = confirm;
