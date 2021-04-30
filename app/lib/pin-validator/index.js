function validate(pin) {
  return pin != undefined && pin.match(/^\d{4}$/);
}

export default validate;
