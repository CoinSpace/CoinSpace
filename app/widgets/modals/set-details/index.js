'use strict';

const Ractive = require('widgets/modals/base');
const details = require('lib/wallet/details');
const { showError } = require('widgets/modals/flash');
const CS = require('lib/wallet');

function open(callback) {
  const userInfo = details.get('userInfo');
  if (userInfo.username && userInfo.username !== '') return callback();

  const ractive = new Ractive({
    partials: {
      content: require('./content.ract'),
    },
    data: {
      username: '',
      isLoading: false,
    },
  });

  ractive.on('submit-details', async () => {
    const username = ractive.get('username').trim();
    if (!username) {
      return showError({ message: 'Without a name, the payer would not be able to identify you on Mecto.' });
    }

    ractive.set('isLoading', true);
    try {
      const safeUsername = await CS.setUsername(username);
      await details.set('userInfo', { username: safeUsername });
      ractive.fire('cancel');
      callback();
    } catch (err) {
      if (err.status === 400) {
        showError({ message: 'Username not available' });
      } else {
        showError({ message: 'Could not save your details' });
      }
    }
    ractive.set('isLoading', false);
  });

  return ractive;
}

module.exports = open;

