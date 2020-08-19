/* global expect */
'use strict';

const validate = require('../index');

describe('pin validator', ()=> {
  it('returns false if undefined', ()=> {
    expect(validate()).toBeFalsy();
  });

  it('returns false for empty string', ()=> {
    expect(validate('')).toBeFalsy();
  });

  it('returns false if not a number', ()=> {
    expect(validate('aaaa')).toBeFalsy();
  });

  it('returns false if it is a mix of numbers and digits', ()=> {
    expect(validate('11a2')).toBeFalsy();
  });

  it('returns false if less than 4 digits', ()=> {
    expect(validate('111')).toBeFalsy();
  });

  it('returns false if more than 4 digits', ()=> {
    expect(validate('11111')).toBeFalsy();
  });

  it('returns true if valid', ()=> {
    expect(validate('1111')).toBeTruthy();
  });
});
