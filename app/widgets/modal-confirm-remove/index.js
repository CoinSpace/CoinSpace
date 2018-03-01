'use strict';

var Ractive = require('widgets/modal');
var showError = require('widgets/modal-flash').showError;
var CS = require('lib/wallet');
var db = require('lib/db');

function open() {

  var ractive = new Ractive({
    partials: {
      content: require('./_content.ract')
    },
    data: {
      confirmation: true,
      success: false,
      removing: false
    }
  });

  ractive.on('remove', function() {
    ractive.set('removing', true);
    CS.removeAccount(function(err) {
      if (err) return handleError(err);
      CS.reset();
      CS.resetPin();
      ractive.set('confirmation', false);
      ractive.set('success', true);
      setTimeout(function() {
        location.reload();
      }, 3000);
    });
  });

  ractive.on('reload', function() {
    location.reload();
  });

  function handleError(err) {
    ractive.set('removing', false);
    showError({message: err.message});
  }

  return ractive;
}

module.exports = open
