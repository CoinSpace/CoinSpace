'use strict';

const Ractive = require('lib/ractive');
const showRemoveConfirmation = require('widgets/modals/confirm-remove-account');
const showTooltip = require('widgets/modals/tooltip');
const { showError } = require('widgets/modals/flash');
const CS = require('lib/wallet');
const details = require('lib/wallet/details');

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      username: '',
      email: '',
    },
  });
  let isLoading = false;

  ractive.on('before-show', () => {
    const user = details.get('userInfo');
    ractive.set('username', user.username);
    ractive.set('email', user.email);
  });

  ractive.on('save', async () => {
    if (isLoading) return;
    const username = ractive.get('username').trim();
    const email = ractive.get('email').trim();
    if (!username) {
      return showError({ message: 'A name is required to set your profile on Coin' });
    }
    isLoading = true;
    try {
      const safeUsername = await CS.setUsername(username);
      await details.set('userInfo', {
        username: safeUsername,
        email,
      });
      ractive.fire('change-step', { step: 'main', userInfo: details.get('userInfo') });
    } catch (err) {
      if (err.status === 400) {
        showError({ message: 'Username not available' });
      } else {
        console.error(err);
      }
    }
    isLoading = false;
  });

  ractive.on('remove', showRemoveConfirmation);

  ractive.on('help-gravatar', () => {
    showTooltip({
      // eslint-disable-next-line max-len
      message: 'Gravatar (globally recognised avatar) is a service that lets you re-use the same avatar across websites and apps by specifying an email address.',
      bottomLink: {
        text: 'Create a gravatar',
        url: 'https://gravatar.com/',
      },
    });
  });

  ractive.on('back', () => {
    ractive.fire('change-step', { step: 'main' });
  });

  return ractive;
};
