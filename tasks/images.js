var copy = require('./util').copy

function images(callback) {
  copy('./app/assets/img', './build/assets/img', callback)
}

module.exports = images
