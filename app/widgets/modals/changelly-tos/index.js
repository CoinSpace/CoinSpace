'use strict';

var db = require('lib/db');
var Ractive = require('widgets/modals/base');

function open(callback) {
  var ractive = new Ractive({
    el: document.getElementById('flash-modal'),
    partials: {
      content: require('./content.ract')
    },
    data: {
      termsChecked: false
    }
  });

  ractive.on('close', function() {
    ractive.fire('cancel');
  });

  ractive.on('toggle-terms-check', function() {
    ractive.set('termsChecked', !ractive.get('termsChecked'));
  });

  ractive.on('accept', function() {
    db.set('changellyTos', true).then(function() {
      ractive.fire('cancel');
      callback();
    }).catch(function(err) {
      console.error(err);
    });
  });

  return ractive;
}

module.exports = open;
