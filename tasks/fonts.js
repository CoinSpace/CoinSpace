var copy = require('./util').copy

function fonts(callback) {
  copy('./app/assets/fonts', './build/assets/fonts', callback)
}

module.exports = fonts
