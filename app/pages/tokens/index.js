'use strict';

var Ractive = require('lib/ractive')
var getNetwork = require('lib/network')

module.exports = function(el){
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      title: 'Available Tokens',
      id: 'token_dropdown',
      tokens: [
        {
          token: 'bitcoin',
          name: 'Bitcoin',
          bitcoin: true
        },
        {
          token: 'bitcoincash',
          name: 'Bitcoin Cash',
          bitcoincash: true
        },
        {
          token: 'litecoin',
          name: 'Litecoin',
          litecoin: true
        },
        {
          token: 'ethereum',
          name: 'Ethereum',
          ethereum: true
        }
      ],
      capitalize: function(str){
        return str.replace(/^.|\s\S/g, function(a) {
         return a.toUpperCase()
        })
      },
      getNetworkClass: function(elId){
        return getNetwork() === elId ? "current" : ""
      }
    }
  })

  ractive.on('switch-token', function(context) {
    var token = context.node.id
    if(token === getNetwork()) return;

    var url = window.location.href.replace(/\?network=\w+/, '') + '?network=' + token
    window.location.assign(url);
  })

  return ractive
}
