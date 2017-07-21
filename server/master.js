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
    fee.getFromAPI(function(err, data) {
      if (err) return console.error(err);
      if (!data.hourFee || !data.fastestFee) return console.error('Bad fee response', data);
      fee.save({hour: data.hourFee, fastest: data.fastestFee})
      if (global.gc) global.gc();
    });
    return intervalFunction;
  }(), interval);
}

function cacheTicker(interval) {
  setInterval(function intervalFunction() {
    ['BTC', 'LTC'].forEach(function(cryptoTicker) {
      ticker.getFromAPI(cryptoTicker, function(err, data) {
        if (err) return console.error(err);
        if (!data) return console.error('Bad ticker response', data);
        ticker.save(cryptoTicker, data)
        if (global.gc) global.gc();
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
