'use strict';

var Ractive = require('lib/ractive');
var emitter = require('lib/emitter');
var initAuth = require('./auth');
var initMain = require('./main');
var db = require('lib/db');

module.exports = function(el) {
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      isLoading: true
    },
    partials: {
      loader: require('./loader.ract')
    }
  });

  var steps = {
    auth: initAuth(ractive.find('#moonpay_auth')),
    main: initMain(ractive.find('#moonpay_main')),
  };
  var currentStep = steps.auth;

  ractive.on('before-show', function() {
    emitter.emit('moonpay');
  });

  ractive.on('before-hide', function() {
    ractive.set('isLoading', true);
    currentStep.hide();
  });

  emitter.on('moonpay', function() {
    var moonpayInfo = db.get('moonpayInfo');
    if (!moonpayInfo) {
      ractive.set('isLoading', false);
      return showStep(steps.auth);
    }
  });

  emitter.on('change-moonpay-step', function(step, data) {
    showStep(steps[step], data);
  })

  function showStep(step, data) {
    setTimeout(function() {
      currentStep.hide();
      step.show(data);
      currentStep = step;
    });
  }

  return ractive;
}
