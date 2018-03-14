'use strict';

var Ractive = require('widgets/modals/base');
var showError = require('widgets/modals/flash').showError;

function open(token, tokens, callback) {

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
    setTimeout(function() {
      // if (err) return handleError(err);
      var index = tokens.indexOf(token);
      tokens.splice(index, 1);
      // Save to db
      console.log('removed', token);
      callback();
      ractive.fire('cancel');
    }, 1000);
  });

  function handleError(err) {
    ractive.set('removing', false);
    showError({message: err.message});
  }

  return ractive;
}

module.exports = open
