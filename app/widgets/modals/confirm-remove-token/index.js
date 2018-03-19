'use strict';

var Ractive = require('widgets/modals/base');
var db = require('lib/db');

function open(token, walletTokens, callback) {

  var ractive = new Ractive({
    partials: {
      content: require('./_content.ract')
    },
    data: {
      removing: false,
      name: token.name
    }
  });

  ractive.on('remove', function() {
    ractive.set('removing', true);
    var index = walletTokens.indexOf(token);
    if (index === -1) return ractive.fire('cancel');

    walletTokens.splice(index, 1);

    db.set('walletTokens', walletTokens).then(function() {
      callback();
      ractive.fire('cancel');
    }).catch(function(err) {
      console.error(err);
      ractive.fire('cancel');
    });
  });

  return ractive;
}

module.exports = open
