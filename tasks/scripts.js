var bundle = require('./util').bundle

process.env.LANGUAGE = process.env.LANGUAGE || 'en'

function scripts(callback) {
  bundle('./app/application.js', './build/assets/js/application-' + process.env.LANGUAGE + '.js', callback)
}

module.exports = scripts
