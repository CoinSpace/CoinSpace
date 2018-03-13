'use strict';

var Ractive = require('widgets/modal');
var showError = require('widgets/modal-flash').showError;

function open(token, callback) {

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
      // Remove from db
      // tokens.indexOf(token) and splice;
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
