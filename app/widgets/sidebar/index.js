'use strict';

var Ractive = require('lib/ractive');
var emitter = require('lib/emitter');
var initAccount = require('widgets/account-details');
var importPrivateKey = require('widgets/modal-import-private-key');
var exportPrivateKeys = require('widgets/modal-export-private-keys');

module.exports = function(el) {
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract')
  });

  initAccount(ractive.find('#account-details'));

  ractive.on('logout', function(context) {
    context.original.preventDefault();
    window.location.reload();
  });

  ractive.on('about', function() {
    emitter.emit('toggle-menu', false);
    emitter.emit('toggle-terms', true);
  });

  ractive.on('import-private-key', function() {
    importPrivateKey();
  });

  ractive.on('export-private-keys', function() {
    exportPrivateKeys();
  });

  emitter.on('toggle-menu', function(open) {
    var classes = ractive.el.classList;
    if (open) {
      classes.add('open');
    } else {
      classes.add('animating');
      classes.remove('open');
      setTimeout(function(){
        classes.remove('animating');
      }, 300);
    }
  });

  return ractive;
}
