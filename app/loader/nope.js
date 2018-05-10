'use strict';
var translate = require('lib/i18n').translate

var message = translate("Sorry, Coin Wallet did not load.") +
  "<br/><br/>" +
  translate("Try updating your browser, or switching out of private browsing mode. If all else fails, download Chrome for your device.")

document.getElementById('loader-message').innerHTML = message
