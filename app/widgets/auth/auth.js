'use strict';

var Ractive = require('lib/ractive')
var emitter = require('lib/emitter')
var showError = require('widgets/modals/flash').showError
var getTokenNetwork = require('lib/token').getTokenNetwork;

var Auth = Ractive.extend({
  el: document.getElementById("auth"),
  template: require('./index.ract'),
  partials: {
    header: require('./header.ract'),
    actions: require('./actions.ract'),
    content: require('./content.ract'),
    footer: require('./footer.ract')
  },
  oninit: function(){
    var self = this
    this.set('opening', false)

    emitter.on('wallet-opening', function(progress){
      self.set('progress', progress)
    })

    self.on('teardown', function(){
      emitter.removeAllListeners('wallet-opening')
    })

    function onDoneError(err) {
      if(err.message === 'user_deleted') {
        return location.reload();
      }

      emitter.emit('clear-pin')

      if(err.message === 'auth_failed') {
        return showError({ message: 'Your PIN is incorrect' })
      }

      console.error(err)
      return showError({ message: err.message })
    }

   function onSyncDone(err) {
      self.set('opening', false)
      if (err) {
        return onDoneError(err)
      }

      window.scrollTo(0, 0)
      emitter.emit('wallet-ready')
    }

    function onTxSyncDone(err, transactions) {
      if (err) {
        emitter.emit('set-transactions', [])
        return onDoneError(err)
      }
      emitter.emit('set-transactions', transactions)
    }

    this.onSyncDone = onSyncDone
    this.onTxSyncDone = onTxSyncDone
    this.getTokenNetwork = getTokenNetwork
  }
})

module.exports = Auth
