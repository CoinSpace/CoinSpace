'use strict';

var Ractive = require('cs-ractive')
var Profile = require('cs-transitions/profileAnimation.js')
var showTooltip = require('cs-modal-tooltip')
var showError = require('cs-modal-flash').showError
var emitter = require('cs-emitter')
var Avatar = require('cs-avatar')
var db = require('cs-db')
var setUsername = require('cs-openalias/xhr.js').setUsername
var getNetwork = require('cs-network')

module.exports = function init(el) {

  var ractive = new Ractive({
    el: el,
    template: require('./index.ract').template,
    data: {
      start_open: true,
      user: {
        firstName: '',
        alias: '',
        email: ''
      },
      editingName: false,
      editingEmail: false,
      animating: false,
      isBitcoin: getNetwork() == 'bitcoin'
    }
  })

  var $previewEl = ractive.nodes['details-preview']
  var $editEl = ractive.nodes['details-edit']
  var $nameEl = ractive.nodes['details-name']

  $nameEl.onkeypress = function(e) {
    e = e || window.event;
    var charCode = e.keyCode || e.which;
    var charStr = String.fromCharCode(charCode);
    if(!charStr.match(/^[a-zA-Z0-9-]+$/)) {
      return false;
    }
  };

  emitter.once('db-ready', function(){
    db.get(function(err, doc){
      if(err) return console.error(err);

      ractive.set('user', doc.userInfo)
      setAvatar()

      if(ractive.get('user.firstName') || getNetwork() != 'bitcoin') {
        Profile.hide($editEl, ractive)
      } else {
        Profile.hide($previewEl, ractive)
      }
    })
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

    setUsername(details.firstName, function(err, alias, username){
      if(err) {
        ractive.set('submitting', false)
        if(err.error === 'username_exists') return showError({message: "Username not available"})
        return console.error(err);
      }

      details.alias = alias
      details.firstName = username

      db.set('userInfo', details, function(err, response){
        if(err) return handleUserError()

        ractive.set('submitting', false)
        emitter.emit('details-updated', details)
        setAvatar()
      })
    })
  })

  function setAvatar(){
    var avatar = Avatar.getAvatar(ractive.get('user.email'),
                                  ractive.get('user.avatarIndex'))
    var avatarEl = ractive.nodes['details-preview'].querySelector('.settings__avatar')
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
