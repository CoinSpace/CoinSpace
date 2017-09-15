'use strict';

var Ractive = require('widgets/modal')

var defaults = {
  error: {
    error: true,
    title: 'Whoops!'
  },
  info: {
    warning: true,
    title: 'Just saying...'
  }
}

function openModal(type, data){
  data = data || {}
  data.error = defaults[type].error
  data.warning = defaults[type].warning
  data.title = data.title || defaults[type].title
  data.type = type

  var ractive = new Ractive({
    el: document.getElementById('flash-modal'),
    partials: {
      content: require('./content.ract')
    },
    data: data
  })

  ractive.on('close', function(){
    ractive.fire('cancel')
  })

  return ractive
}

function showError(data) {
  return openModal('error', data)
}

function showInfo(data) {
  return openModal('info', data)
}

module.exports = {
  showError: showError,
  showInfo: showInfo
}
