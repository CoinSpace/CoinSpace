var geo = require('./geo')
var fee = require('./fee')
var ticker = require('./ticker')

function cleanGeo(interval) {
  setInterval(function intervalFunction(){
    geo.getIdsOlderThan(interval, function(err, docs) {
      if (err) return console.error(err);
      docs.forEach(geo.remove);
    });
    return intervalFunction;
  }(), interval)
}

function cacheFees(interval) {
  setInterval(function intervalFunction() {
    fee.getFromAPI('bitcoin').then(function(data) {
      fee.save('bitcoin', {
        minimum: data.minimum,
        hour: data.hourFee,
        fastest: data.fastestFee
      });
      if (global.gc) global.gc();
    }).catch(function(err) {
      console.error(err);
    });
    return intervalFunction;
  }(), interval);
}

function cacheTicker(interval) {
  setInterval(function intervalFunction() {
    ['BTC', 'BCH', 'LTC', 'ETH'].forEach(function(cryptoTicker) {
      ticker.getFromAPI(cryptoTicker).then(function(data) {
        ticker.save(cryptoTicker, data)
        if (global.gc) global.gc();
      }).catch(function(err) {
        console.error(err);
      });
    })

    return intervalFunction;
  }(), interval);
}

module.exports = {
  cleanGeo: cleanGeo,
  cacheFees: cacheFees,
  cacheTicker: cacheTicker
}
