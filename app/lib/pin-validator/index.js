'use strict';

function validate(pin) {
  return pin != undefined && pin.match(/^\d{4}$/);
}

module.exports = validate;
