'use strict';

var Ractive = require('../auth');
var pinPage = require('../pin');

function confirm(prevPage, data) {
  var words = data.mnemonic.split(' ');
  var firstWord = words[data.randomIndexes[0]];
  var secondWord = words[data.randomIndexes[1]];

  var ractive = new Ractive({
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
      isCorrect: function() {
        return this.get('firstWord').trim() === firstWord && this.get('secondWord').trim() === secondWord;
      }
    }
  });

  ractive.on('clearWord', function(context) {
    var dataContext = context.node.getAttribute('data-context');
    if (dataContext === 'first-word') {
      ractive.set('firstWord', '');
      ractive.find('#first-word').focus();
    } else if (dataContext === 'second-word') {
      ractive.set('secondWord', '');
      ractive.find('#second-word').focus();
    }
  });

  ractive.on('back', function() {
    if (prevPage) prevPage(data);
  });

  ractive.on('confirm', function() {
    pinPage(prevPage, data);
  });

  return ractive;
}

module.exports = confirm;
