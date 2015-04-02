'use strict';

var translate = require('counterpart')
var fs = require('fs')

translate.setSeparator('*')

var translation = fs.readFileSync(__dirname + '/translations/' + process.env.LANGUAGE + '.json', {encoding: 'utf8'})
translate.registerTranslations(process.env.LANGUAGE, JSON.parse(translation))
translate.setLocale(process.env.LANGUAGE)

var languages = fs.readdirSync(__dirname + '/translations').map(function(f){
  return f.replace('.json', '')
})

module.exports = {
  translate: translate,
  languages: languages
}
