var async = require('async')
var fs = require('fs')
var request = require("request")
var transifexFormatToRfc4646 = require("cs-language-code-convert")

var SOURCE_DIR = "./app/lib/i18n/translations/"
var BASE_URL = "https://www.transifex.com/api/2/project/coinspace-js/"
var PROJECT_URL = BASE_URL + "?details"
var RESOURCE_URL = BASE_URL + "resource/translation/content/"
var authHeader = "Basic " + new Buffer(process.env.TRANSIFEX_USER + ":" + process.env.TRANSIFEX_PASSWORD).toString("base64");

function languageUrl(language) {
  return BASE_URL + "language/" + language + "/?details"
}

function translationUrl(language) {
  return BASE_URL + "resource/translation/translation/" + language + "/?file"
}

function requestAPI(url, options, callback) {
  if(typeof options === 'function') {
    callback = options
    options = {}
  }

  if(process.env.TRANSIFEX_USER == null) {
    return callback(new Error('process.env.TRANSIFEX_USER is missing'))
  }

  if(process.env.TRANSIFEX_PASSWORD == null) {
    return callback(new Error('process.env.TRANSIFEX_PASSWORD is missing'))
  }

  options.url = url
  options.headers = { "Authorization": authHeader }
  if(options.json == undefined) options.json = true

  request(options, function(error, response, body) {
    if (error) return callback(error);

    if (response.statusCode !== 200) {
      //FIXME: TypeError: This handle type can't be sent
      return callback(new Error(url + " returned " + response.statusCode))
    }

    callback(null, body)
  })
}

function pull(done) {
  console.log('fetching available languages...')

  completePercentages = {}

  requestAPI(PROJECT_URL, function(err, project){
    if(err) return done(err)

    async.filter(project.teams, function(language, callback){
      requestAPI(languageUrl(language), function(err, translation){
        if(err) {
          console.error(err.message);
          console.error(err.stack)
          return callback(false)
        }

        var completed_percentage = Math.round(translation.translated_segments * 100 / translation.total_segments)
        var include = completed_percentage >= 90
        if(include) {
          completePercentages[language] = completed_percentage
        }

        callback(include)
      })
    }, updateTranslations)
  })

  function updateTranslations(languages) {
    console.log("Languages to update", languages)
    async.parallel(languages.map(function(language){
      return updateTranslation(language)
    }), done)
  }

  function updateTranslation(language){
    return function(callback){
      requestAPI(translationUrl(language), { json: false }, function(err, translation){
        if(err) return callback(err);

        var filename = SOURCE_DIR + transifexFormatToRfc4646(language).toLowerCase() + ".json"
        fs.writeFile(filename, translation, function(err){
          if(err) {
            console.error('Failed to update', filename)
            return callback(err)
          }

          console.log(language, 'done. Complete percentage:', completePercentages[language] + '%')
          callback()
        })
      })
    }
  }
}

function push(done) {
  var sourceContent = fs.readFileSync(SOURCE_DIR + 'en.json', { encoding: 'utf8' })

  console.log('uploading source file...')

  requestAPI(RESOURCE_URL, {method: "PUT", json: {content: sourceContent}}, function(err, data) {
    if(err) return done(err);

    console.log(data)
    done()
  })
}

module.exports = {
  pull: pull,
  push: push
}
