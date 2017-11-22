var db = require('./db')
var mectoDB = db('mecto')

var SEARCH_RADIUS = 1000

function save(lat, lon, userInfo, callback) {
  mectoDB.save(userInfo.id, {
    name: userInfo.name,
    email: userInfo.email,
    avatarIndex: userInfo.avatarIndex,
    address: userInfo.address,
    network: userInfo.network,
    timestamp: new Date().getTime(),
    geometry: {
      coordinates: [lon, lat],
      type: 'Point'
    }
  }, function(err) {
    if (err) return callback(err);
    callback()
  });
}

function remove(doc) {
  mectoDB.remove(doc._id, doc._rev, function(err) {
    if (err) console.error('FATAL: failed to delete mecto doc')
  });
}

function getIdsOlderThan(age, callback) {
  var now = new Date().getTime();
  var query = {
    selector: {
      _id: { $gt: 0 },
      timestamp: { $lt: now - age }
    },
    fields: [ '_id', '_rev' ],
    limit: 100
  };
  mectoDB.connection.request({method: 'POST', path: '/mecto/_find', body: query}, function(err, result) {
    if (err) return callback(err);
    callback(null, result.docs);
  });
}

function getById(id, callback) {
  if (!id) return callback();
  mectoDB.get(id, function(err, doc) {
    if (err) return callback(err);
    callback(null, doc);
  })
}

function search(lat, lon, userInfo, callback) {
  if (['bitcoin', 'bitcoincash', 'litecoin', 'testnet', 'ethereum'].indexOf(userInfo.network) === -1) {
    return callback({error: 'unsupported_network'})
  }

  var path = '/mecto/_design/geoDoc/_geo/' + userInfo.network + 'GeoIndex';
  var query = {
    lat: lat,
    lon: lon,
    radius: SEARCH_RADIUS,
    limit: 15,
    relation: 'contains',
    include_docs: true
  };

  mectoDB.connection.request({method: 'GET', path: path, query: query}, function(err, results) {
    if (err) return callback(err);

    results = results.filter(function(item) {
      return item.id !== userInfo.id;
    }).map(function(item) {
      return [{
        address: item.doc.address,
        name: item.doc.name,
        email: item.doc.email,
        avatarIndex: item.doc.avatarIndex
      }]
    });

    callback(null, results);
  });
}

module.exports = {
  SEARCH_RADIUS: SEARCH_RADIUS,
  save: save,
  search: search,
  remove: remove,
  getIdsOlderThan: getIdsOlderThan,
  getById: getById
}
