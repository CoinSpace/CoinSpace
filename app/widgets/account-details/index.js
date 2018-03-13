'use strict';

var Ractive = require('lib/ractive')
var Profile = require('lib/transitions/profileAnimation.js')
var showTooltip = require('widgets/modal-tooltip')
var showError = require('widgets/modal-flash').showError
var emitter = require('lib/emitter')
var Avatar = require('lib/avatar')
var db = require('lib/db')
var setUsername = require('lib/wallet').setUsername
var showRemoveConfirmation = require('widgets/modal-confirm-remove-account')

module.exports = function init(el) {

  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      start_open: true,
      user: {
        firstName: '',
        email: ''
      },
      editingName: false,
      editingEmail: false,
      animating: false
    }
  })

  var $previewEl = ractive.find('#details-preview')
  var $editEl = ractive.find('#details-edit')
  var $nameEl = ractive.find('#details-name')

  $nameEl.onkeypress = function(e) {
    e = e || window.event;
    var charCode = e.keyCode || e.which;
    var charStr = String.fromCharCode(charCode);
    if(!charStr.match(/^[a-zA-Z0-9-]+$/)) {
      return false;
    }
  };

  emitter.once('db-ready', function(){
    var userInfo = db.get('userInfo');
    ractive.set('user', userInfo);
    setAvatar()

    if (ractive.get('user.firstName')) {
      Profile.hide($editEl, ractive)
    } else {
      Profile.hide($previewEl, ractive)
    }
  })

  ractive.on('edit-details', function(){
    if(ractive.get('animating')) return;
    Profile.hide($previewEl, ractive, function(){
      Profile.show($editEl, ractive)
    })
  })

  emitter.on('details-updated', function(details){
    ractive.set('user', details)
    Profile.hide($editEl, ractive, function(){
      Profile.show($previewEl, ractive)
    })
  })

  ractive.on('help', function() {
    showTooltip({
      message: 'Gravatar (globally recognised avatar) is a service that lets you re-use the same avatar across websites and apps by specifying an email address.',
      link: {
        text: 'Create a gravatar',
        url: 'https://gravatar.com/'
      }
    })
  })

  ractive.on('submit-details', function(){
    if(ractive.get('animating')) return;

    var details = ractive.get('user')

    if(blank(details.firstName)) {
      return showError({message: "A name is required to set your profile on Coin Space"})
    }

    if(blank(details.email) && details.avatarIndex == undefined) {
      details.avatarIndex = Avatar.randAvatarIndex()
    }

    ractive.set('submitting', true)

    setUsername(details.firstName, function(err, username){
      if(err) {
        ractive.set('submitting', false)
        if(err.message === 'username_exists') return showError({message: "Username not available"})
        return console.error(err);
      }

      details.firstName = username

      db.set('userInfo', details).then(function() {
        ractive.set('submitting', false);
        emitter.emit('details-updated', details);
        setAvatar();
      }).catch(function() {
        handleUserError();
      });

    })
  })

  ractive.on('remove-account', function() {
    showRemoveConfirmation();
  });

  function setAvatar(){
    var avatar = Avatar.getAvatar(ractive.get('user.email'),
                                  ractive.get('user.avatarIndex'))
    var avatarEl = ractive.find('#details-preview').querySelector('.settings__avatar')
    avatarEl.style.setProperty('background-image', "url('" + avatar + "')")
  }

  function handleUserError() {
    var data = {
      title: "Uh Oh...",
      message: "Could not save your details"
    }
    showError(data)
  }

  function blank(str) {
    return (str == undefined || str.trim() === '')
  }

  return ractive
}
