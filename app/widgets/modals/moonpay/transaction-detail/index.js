'use strict';

var Ractive = require('widgets/modals/base');
var showError = require('widgets/modals/flash').showError;
var moonpay = require('lib/moonpay');

var ractive;

function open(data) {
  ractive = new Ractive({
    partials: {
      content: require('./content.ract')
    },
    data: {
      tx: data.tx,
      isLoadingAuthorization: false,
      threedsecure: function() {}
    }
  });

  if (data.tx.status === 'waitingAuthorization') {
    ractive.set('isLoadingAuthorization', false);
    ractive.set('threedsecure', function() {
      ractive.set('isLoadingAuthorization', true);
      moonpay.open3dSecure(data.tx.redirectUrl).then(function() {
        ractive.set('onDismiss', function() {
          data.onSuccessDismiss();
        });
        ractive.fire('cancel');
      }).catch(function(err) {
        if (err.message !== '3d_failed') console.error(err);
        ractive.set('isLoadingAuthorization', false);
        showError({message: '3D secure authentication failed'});
      });
    });
  }

  ractive.on('close', function() {
    ractive.fire('cancel');
  });

  return ractive;
}

module.exports = open;
