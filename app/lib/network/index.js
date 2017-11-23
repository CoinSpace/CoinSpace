'use strict';

module.exports = function(defaultNetwork) {
  if (typeof defaultNetwork === 'undefined') {
    defaultNetwork = 'bitcoin';
  }

  var regex = /^network=/
  var networkParam = window.location.search.substr(1).split('&').filter(function(e){
    return e.match(regex)
  })[0]

  return networkParam ? networkParam.replace(regex, '') : defaultNetwork;
}
