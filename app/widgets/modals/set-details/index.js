'use strict';

const Ractive = require('widgets/modals/base');
const db = require('lib/db');
const emitter = require('lib/emitter');
const { showError } = require('widgets/modals/flash');
const CS = require('lib/wallet');

function fetchDetails(callback) {
  const userInfo = db.get('userInfo');
  const name = userInfo.firstName;
  if (name && name !== '') {
    return callback();
  }

  openModal({
    name,
    email: userInfo.email,
    callback,
  });
}

function openModal(data) {
  const ractive = new Ractive({
    partials: {
      content: require('./content.ract'),
    },
  });

  const $nameEl = ractive.find('#set-details-name');

  $nameEl.onkeypress = function(e) {
    e = e || window.event;
    const charCode = e.keyCode || e.which;
    const charStr = String.fromCharCode(charCode);
    if (!charStr.match(/^[a-zA-Z0-9-]+$/)) {
      return false;
    }
  };

  ractive.on('close', () => {
    ractive.fire('cancel');
  });

  ractive.on('submit-details', () =>{
    const details = {
      firstName: ractive.get('name') + '',
      email: ractive.get('email'),
    };

    if (!details.firstName || details.firstName.trim() === 'undefined') {
      return showError({ message: "Without a name, the payer would not be able to identify you on Mecto." });
    }

    ractive.set('submitting', true);

    CS.setUsername(details.firstName)
      .then((username) => {
        details.firstName = username;

        db.set('userInfo', details)
          .then(() => {
            ractive.fire('cancel');
            ractive.set('submitting', false);
            emitter.emit('details-updated', details);
            data.callback();
          })
          .catch(data.callback);
      })
      .catch((err) => {
        ractive.set('submitting', false);
        if (err.status === 400) {
          return showError({ message: "Username not available" });
        }
        return console.error(err);
      });
  });

  return ractive;
}

module.exports = fetchDetails;

