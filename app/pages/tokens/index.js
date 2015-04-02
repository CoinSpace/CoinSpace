'use strict';

var Ractive = require('cs-ractive')
var getNetwork = require('cs-network')

module.exports = function(el){
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract').template,
    data: {
      title: 'Available Tokens',
      id: 'token_dropdown',
      tokens: [
        {
          token: 'bitcoin',
          bitcoin: true
        },
        {
          token: 'litecoin',
          litecoin: true
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

  ractive.on('switch-token', function(event) {
    var token = event.node.id
    if(token === getNetwork()) return;

    var url = window.location.href.replace(/\?network=\w+/, '') + '?network=' + token
    window.location.assign(url);
  })

  return ractive
}
