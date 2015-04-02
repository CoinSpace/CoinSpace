var querystring = require('querystring')
var request = require('request');

function sendPassphrase(phone, passphrase, callback) {
  var message = 'Coin Space Passphrase: ' + passphrase
  send(phone, message, callback)
}

function send(phone, message, callback) {
  var getData = {
    user: process.env.SMS_USER,
    password: process.env.SMS_PASSWORD,
    api_id: process.env.SMS_API_ID,
    from: process.env.SMS_FROM,
    mo: process.env.SMS_MO,
    to: phone,
    text: message
  }

  request.get({
    uri: 'http://api.clickatell.com/http/sendmsg?' + querystring.stringify(getData),
    headers: {
      'accept': '*/*'
    }
  }, function (err, resp, body) {
    if(err) return callback(err)
    callback(null)
  })
}

module.exports = {
  sendPassphrase: sendPassphrase
}