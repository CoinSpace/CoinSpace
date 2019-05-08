'use strict';

var Ractive = require('lib/ractive');
var emitter = require('lib/emitter');
var db = require('lib/db');
var translate = require('lib/i18n').translate;

module.exports = function(el) {
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      message: '',
      showEmail: true
    },
    partials: {
      footer: require('../footer.ract')
    }
  });

  ractive.on('before-show', function(context) {
    ractive.set('message', translate(context.message, context.interpolations));
    ractive.set('showEmail', !!context.showEmail)
  });

  ractive.on('close', function() {
    db.set('changellyInfo', null).then(function() {
      emitter.emit('change-changelly-step', 'enterAmount');
    }).catch(function(err) {
      console.error(err);
    });
  });

  return ractive;
}
