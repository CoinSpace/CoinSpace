'use strict';

const Ractive = require('widgets/modals/base');
const { showError } = require('widgets/modals/flash');
const moonpay = require('lib/moonpay');

let ractive;

function open(data) {
  ractive = new Ractive({
    partials: {
      content: require('./content.ract'),
    },
    data: {
      tx: data.tx,
      isLoadingAuthorization: false,
      threedsecure() {},
    },
  });

  if (data.tx.status === 'waitingAuthorization') {
    ractive.set('isLoadingAuthorization', false);
    ractive.set('threedsecure', () => {
      ractive.set('isLoadingAuthorization', true);
      moonpay.open3dSecure(data.tx.redirectUrl).then(() => {
        ractive.set('onDismiss', () => {
          data.onSuccessDismiss();
        });
        ractive.fire('cancel');
      }).catch((err) => {
        if (err.message !== '3d_failed') console.error(err);
        ractive.set('isLoadingAuthorization', false);
        showError({ message: '3D secure authentication failed' });
      });
    });
  }

  ractive.on('close', () => {
    ractive.fire('cancel');
  });

  return ractive;
}

module.exports = open;
