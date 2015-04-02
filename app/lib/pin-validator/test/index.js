var validate = require('../index')

describe('pin validator', function(){
  it('returns false if undefined', function(){
    expect(validate()).toBeFalsy()
  })

  it('returns false for empty string', function(){
    expect(validate('')).toBeFalsy()
  })

  it('returns false if not a number', function(){
    expect(validate('aaaa')).toBeFalsy()
  })

  it('returns false if it is a mix of numbers and digits', function(){
    expect(validate('11a2')).toBeFalsy()
  })

  it('returns false if less than 4 digits', function(){
    expect(validate('111')).toBeFalsy()
  })

  it('returns false if more than 4 digits', function(){
    expect(validate('11111')).toBeFalsy()
  })

  it('returns true if valid', function(){
    expect(validate('1111')).toBeTruthy()
  })
})
