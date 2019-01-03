'use strict';
var Ractive = require('ractive/runtime.js')
if (process.env.NODE_ENV === 'production') {
  Ractive.DEBUG = false;
}
var translate = require('lib/i18n').translate

// extracted from https://github.com/RactiveJS/Ractive-events-keys
var makeKeyDefinition = function ( code ) {
  return function ( node, fire ) {
    var keydownHandler;

    node.addEventListener( 'keydown', keydownHandler = function ( event ) {
      var which = event.which || event.keyCode;

      if ( which === code ) {
        event.preventDefault();

        fire({
          node: node,
          original: event
        });
      }
    }, false );

    return {
      teardown: function () {
        node.removeEventListener( 'keydown', keydownHandler, false );
      }
    };
  };
};

var events = Ractive.events

events.enter = makeKeyDefinition(13);
events.tab = makeKeyDefinition(9);
events.escape = makeKeyDefinition(27);
events.space = makeKeyDefinition(32);

events.leftarrow = makeKeyDefinition(37);
events.rightarrow = makeKeyDefinition(39);
events.downarrow = makeKeyDefinition(40);
events.uparrow = makeKeyDefinition(38);

var partials = Ractive.partials

partials.svg_arrow = require('lib/svg/arrow.ract')
partials.svg_cancel = require('lib/svg/cancel.ract')
partials.svg_caret = require('lib/svg/caret.ract')
partials.svg_close = require('lib/svg/close.ract')
partials.svg_exit = require('lib/svg/exit.ract')
partials.svg_help = require('lib/svg/help.ract')
partials.svg_hex_large = require('lib/svg/hex_large.ract')
partials.svg_history = require('lib/svg/history.ract')
partials.svg_lock = require('lib/svg/lock.ract')
partials.svg_logo_key = require('lib/svg/logo_key.ract')
partials.svg_logo_stack = require('lib/svg/logo_stack.ract')
partials.svg_logo = require('lib/svg/logo.ract')
partials.svg_qr = require('lib/svg/qr.ract')
partials.svg_expand = require('lib/svg/expand.ract')
partials.svg_email = require('lib/svg/email.ract')
partials.svg_receive = require('lib/svg/receive.ract')
partials.svg_refresh = require('lib/svg/refresh.ract')
partials.svg_send = require('lib/svg/send.ract')
partials.svg_sendto = require('lib/svg/sendto.ract')
partials.svg_settings = require('lib/svg/settings.ract')
partials.svg_success = require('lib/svg/success.ract')
partials.svg_token_bitcoin = require('lib/svg/token_bitcoin.ract')
partials.svg_token_bitcoincash = require('lib/svg/token_bitcoincash.ract')
partials.svg_token_litecoin = require('lib/svg/token_litecoin.ract')
partials.svg_token_ethereum = require('lib/svg/token_ethereum.ract')
partials.svg_token_ripple = require('lib/svg/token_ripple.ract')
partials.svg_token_stellar = require('lib/svg/token_stellar.ract')
partials.svg_token_eos = require('lib/svg/token_eos.ract')
partials.svg_letter_t = require('lib/svg/letter_t.ract')
partials.svg_token = require('lib/svg/token.ract')
partials.svg_user = require('lib/svg/user.ract')
partials.svg_mecto = require('lib/svg/mecto.ract')
partials.svg_warning = require('lib/svg/warning.ract')
partials.svg_mecto_not_found = require('lib/svg/mecto_not_found.ract')
partials.svg_exchange = require('lib/svg/exchange.ract')
partials.svg_error = require('lib/svg/error.ract')
partials.svg_appstore = require('lib/svg/appstore.ract')
partials.svg_shapeshift = require('lib/svg/shapeshift.ract')

Ractive.prototype.hide = function(context){
  this.fire('before-hide', context)
  this.el.classList.remove('current')
}

Ractive.prototype.show = function(context){
  this.fire('before-show', context)
  this.el.classList.add('current')
}

Ractive.defaults.data = { translate: translate }

module.exports = Ractive
