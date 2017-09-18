'use strict';

var crypto = require('crypto')
var avatars = [
  require('../../assets/img/avatar_0.png'),
  require('../../assets/img/avatar_1.png'),
  require('../../assets/img/avatar_2.png'),
  require('../../assets/img/avatar_3.png'),
  require('../../assets/img/avatar_4.png'),
  require('../../assets/img/avatar_5.png'),
  require('../../assets/img/avatar_6.png'),
  require('../../assets/img/avatar_7.png'),
  require('../../assets/img/avatar_8.png'),
  require('../../assets/img/avatar_9.png')
]

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
  return avatars[index]
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
