'use strict';

var crypto = require('crypto')

function formatEmail(email){
  return email.trim().toLowerCase()
}

function emailToAvatar(email){
  email = formatEmail(email)

  return [
    'https://www.gravatar.com/avatar/',
    crypto.createHash('md5').update(email).digest('hex'),
    '?size=200'
  ].join('')
}

function randAvatarIndex(){
  return Math.floor(Math.random() * 10)
}

function getAvatarByIndex(index) {
  return "assets/img/avatar_" + index + ".png"
}

function getAvatar(email, avatarIndex){
  if(!blank(email)){
    return emailToAvatar(email)
  }
  return getAvatarByIndex(avatarIndex)
}

function blank(str) {
  return (str == undefined || str.trim() === '')
}

module.exports = {
  emailToAvatar: emailToAvatar,
  randAvatarIndex: randAvatarIndex,
  getAvatarByIndex: getAvatarByIndex,
  getAvatar: getAvatar
}
