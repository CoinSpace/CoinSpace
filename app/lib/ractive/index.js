'use strict';
var Ractive = require('ractive/build/ractive.runtime')
var translate = require('cs-i18n').translate

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

partials.svg_arrow = require('cs-svg/arrow.ract').template
partials.svg_cancel = require('cs-svg/cancel.ract').template
partials.svg_caret = require('cs-svg/caret.ract').template
partials.svg_close = require('cs-svg/close.ract').template
partials.svg_exit = require('cs-svg/exit.ract').template
partials.svg_help = require('cs-svg/help.ract').template
partials.svg_hex_large = require('cs-svg/hex_large.ract').template
partials.svg_history = require('cs-svg/history.ract').template
partials.svg_lock = require('cs-svg/lock.ract').template
partials.svg_logo_key = require('cs-svg/logo_key.ract').template
partials.svg_logo_stack = require('cs-svg/logo_stack.ract').template
partials.svg_logo = require('cs-svg/logo.ract').template
partials.svg_qr = require('cs-svg/qr.ract').template
partials.svg_expand = require('cs-svg/expand.ract').template
partials.svg_email = require('cs-svg/email.ract').template
partials.svg_receive = require('cs-svg/receive.ract').template
partials.svg_refresh = require('cs-svg/refresh.ract').template
partials.svg_send = require('cs-svg/send.ract').template
partials.svg_sendto = require('cs-svg/sendto.ract').template
partials.svg_settings = require('cs-svg/settings.ract').template
partials.svg_success = require('cs-svg/success.ract').template
partials.svg_token_bitcoin = require('cs-svg/token_bitcoin.ract').template
partials.svg_token_litecoin = require('cs-svg/token_litecoin.ract').template
partials.svg_token = require('cs-svg/token.ract').template
partials.svg_user = require('cs-svg/user.ract').template
partials.svg_mecto = require('cs-svg/mecto.ract').template
partials.svg_warning = require('cs-svg/warning.ract').template
partials.svg_mecto_not_found = require('cs-svg/mecto_not_found.ract').template
partials.svg_error = require('cs-svg/error.ract').template
partials.svg_appstore = require('cs-svg/appstore.ract').template

Ractive.prototype.hide = function(){
  this.fire('before-hide')
  this.el.classList.remove('current')
}

Ractive.prototype.show = function(){
  this.fire('before-show')
  this.el.classList.add('current')
}

Ractive.data = { translate: translate }

module.exports = Ractive
