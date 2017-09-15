'use strict';

var Ractive = require('widgets/modal')
var db = require('lib/db')
var showError = require('widgets/modal-flash').showError
var sendRequest = require('lib/zendesk')
var getNetwork = require('lib/network')

function fetchDetails(data){
  db.get(function(err, doc){
    if(err) return showError(err);

    data = data || {}
    data.name = doc.userInfo.firstName,
    data.email = doc.userInfo.email
    openModal(data)
  })
}

function openModal(data){
  var ractive = new Ractive({
    partials: {
      content: require('./content.ract')
    },
    data: data
  })

  var params = {}
  ractive.on('submit-details', function(){
    var hasError = ['name', 'email', 'description'].some(function(field){
      if(isBlankField(field)) {
        var translatedField = ractive.data.translate(field)
        var options = {message: "cannot be blank", interpolations: { blankField: translatedField }}
        showError(options)
        return true
      }

      params[field] = ractive.get(field)
    })

    if(hasError) return;

    params['subject'] = 'Support request from Coin space for ' + getNetwork()
    sendRequest(params, function(){
      ractive.fire('cancel')
    })
  })

  ractive.on('close', function(){
    ractive.fire('cancel')
  })

  function isBlankField(field){
    var value = ractive.get(field)
    return (!value || value.toString().trim() === '')
  }

  return ractive
}

module.exports = fetchDetails

