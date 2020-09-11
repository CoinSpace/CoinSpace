'use strict';

const Ractive = require('lib/ractive');
const Profile = require('lib/transitions/profileAnimation.js');
const showTooltip = require('widgets/modals/tooltip');
const { showError } = require('widgets/modals/flash');
const emitter = require('lib/emitter');
const Avatar = require('lib/avatar');
const details = require('lib/wallet/details');
const CS = require('lib/wallet');
const showRemoveConfirmation = require('widgets/modals/confirm-remove-account');

module.exports = function init(el) {

  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      start_open: true,
      user: {
        firstName: '',
        email: '',
      },
      editingName: false,
      editingEmail: false,
      animating: false,
    },
  });

  const $previewEl = ractive.find('#details-preview');
  const $editEl = ractive.find('#details-edit');
  const $nameEl = ractive.find('#details-name');

  $nameEl.onkeypress = (e) => {
    e = e || window.event;
    const charCode = e.keyCode || e.which;
    const charStr = String.fromCharCode(charCode);
    if (!charStr.match(/^[a-zA-Z0-9-]+$/)) {
      return false;
    }
  };

  emitter.once('wallet-ready', () => {
    const userInfo = details.get('userInfo');
    ractive.set('user', Object.assign({}, userInfo));
    setAvatar();

    if (ractive.get('user.firstName')) {
      Profile.hide($editEl, ractive);
    } else {
      Profile.hide($previewEl, ractive);
    }
  });

  ractive.on('edit-details', () => {
    if (ractive.get('animating')) return;
    Profile.hide($previewEl, ractive, () => {
      Profile.show($editEl, ractive);
    });
  });

  emitter.on('details-updated', (user) => {
    ractive.set('user', user);
    Profile.hide($editEl, ractive, () => {
      Profile.show($previewEl, ractive);
    });
  });

  ractive.on('help', () => {
    showTooltip({
      // eslint-disable-next-line max-len
      message: 'Gravatar (globally recognised avatar) is a service that lets you re-use the same avatar across websites and apps by specifying an email address.',
      bottomLink: {
        text: 'Create a gravatar',
        url: 'https://gravatar.com/',
      },
    });
  });

  ractive.on('submit-details', () => {
    if (ractive.get('animating')) return;

    const user = ractive.get('user');

    if (blank(user.firstName)) {
      return showError({ message: "A name is required to set your profile on Coin" });
    }

    if (blank(user.email) && user.avatarIndex == undefined) {
      user.avatarIndex = Avatar.randAvatarIndex();
    }

    ractive.set('submitting', true);

    CS.setUsername(user.firstName)
      .then((username) => {
        user.firstName = username;

        details.set('userInfo', user).then(() => {
          ractive.set('submitting', false);
          emitter.emit('details-updated', user);
          setAvatar();
        }).catch(() => {
          handleUserError();
        });
      })
      .catch((err) => {
        ractive.set('submitting', false);
        if (err.status === 400) {
          return showError({ message: "Username not available" });
        }
        return console.error(err);
      });
  });

  ractive.on('remove-account', () => {
    showRemoveConfirmation();
  });

  function setAvatar() {
    const avatar = Avatar.getAvatar(ractive.get('user.email'),
      ractive.get('user.avatarIndex'));
    const avatarEl = ractive.find('#details-preview').querySelector('.settings__avatar');
    avatarEl.style.setProperty('background-image', "url('" + avatar + "')");
  }

  function handleUserError() {
    const data = {
      title: "Uh Oh...",
      message: "Could not save your details",
    };
    showError(data);
  }

  function blank(str) {
    return (str == undefined || str.trim() === '');
  }

  return ractive;
};
