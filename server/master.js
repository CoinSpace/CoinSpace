var geo = require('./geo')
var fee = require('./fee')
var ticker = require('./ticker')

function cleanGeo(interval) {
  setInterval(function intervalFunction(){
    geo.removeOlderThan(interval).catch(console.error);
    return intervalFunction;
  }(), interval)
}

function cacheFees(interval) {
  setInterval(function intervalFunction() {
    fee.getFromAPI('bitcoin').then(function(data) {
      if (global.gc) global.gc();
      return fee.save('bitcoin', {
        minimum: data.minimum,
        hour: data.hourFee,
        fastest: data.fastestFee
      });
    }).catch(console.error);
    return intervalFunction;
  }(), interval);
}

function cacheTicker(interval) {
  setInterval(function intervalFunction() {
    ['BTC', 'BCH', 'LTC', 'ETH'].forEach(function(cryptoTicker) {
      ticker.getFromAPI(cryptoTicker).then(function(data) {
        if (global.gc) global.gc();
        return ticker.save(cryptoTicker, data)
      }).catch(console.error);
    })

    return intervalFunction;
  }(), interval);
}

module.exports = {
  cleanGeo: cleanGeo,
  cacheFees: cacheFees,
  cacheTicker: cacheTicker
}
