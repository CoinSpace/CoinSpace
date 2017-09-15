'use strict';

var Ractive = require('widgets/modal')
var db = require('lib/db')
var emitter = require('lib/emitter')
var showError = require('widgets/modal-flash').showError
var setUsername = require('lib/wallet/auth.js').setUsername

function fetchDetails(callback){
  db.get(function(err, doc){
    if(err) return callback(err);

    var name = doc.userInfo.firstName
    if(name && name !== '') {
      return callback()
    }

    openModal({
      name: name,
      email: doc.userInfo.email,
      callback: callback
    })
  })
}

function openModal(data){
  var ractive = new Ractive({
    partials: {
      content: require('./content.ract')
    }
  })

  var $nameEl = ractive.find('#set-details-name')

  $nameEl.onkeypress = function(e) {
    e = e || window.event;
    var charCode = e.keyCode || e.which;
    var charStr = String.fromCharCode(charCode);
    if(!charStr.match(/^[a-zA-Z0-9-]+$/)) {
      return false;
    }
  };

  ractive.on('close', function(){
    ractive.fire('cancel')
  })

  ractive.on('submit-details', function(){
    var details = {
      firstName: ractive.get('name') + '',
      email: ractive.get('email')
    }

    if(!details.firstName || details.firstName.trim() === 'undefined') {
      return showError({message: "Without a name, the payer would not be able to identify you on Mecto."})
    }

    ractive.set('submitting', true)

    setUsername(details.firstName, function(err, username){
      if(err) {
        ractive.set('submitting', false)
        if(err.error === 'username_exists') return showError({message: "Username not available"})
        return console.error(err);
      }

      details.firstName = username

      db.set('userInfo', details, function(err){
        if(err) return data.callback(err);

        ractive.fire('cancel', undefined)
        ractive.set('submitting', false)
        emitter.emit('details-updated', details)
        data.callback()
      })
    })
  })

  return ractive
}

module.exports = fetchDetails

