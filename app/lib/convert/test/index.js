var convert = require('../index')

describe('convert', function(){
  describe('btcToSatoshi', function(){
    it('works for 0', function(){
      expect(convert.btcToSatoshi(0)).toEqual(0)
    })

    it('works for non-zero', function(){
      expect(convert.btcToSatoshi(1)).toEqual(100000000)
      expect(convert.btcToSatoshi(0.005)).toEqual(500000)
      expect(convert.btcToSatoshi(0.009)).toEqual(900000)
    })

    it('returns undefined for empty value', function(){
      expect(convert.btcToSatoshi()).toEqual(undefined)
      expect(convert.btcToSatoshi(null)).toEqual(undefined)
      expect(convert.btcToSatoshi('')).toEqual(undefined)
    })
  })

  describe('satoshiToBtc', function(){
    it('works for 0', function(){
      expect(convert.satoshiToBtc(0)).toEqual(0)
    })

    it('works for non-zero', function(){
      expect(convert.satoshiToBtc(12345)).toEqual(0.00012345)
      expect(convert.satoshiToBtc(123456789)).toEqual(1.23456789)
    })

    it('returns undefined for empty value', function(){
      expect(convert.satoshiToBtc()).toEqual(undefined)
      expect(convert.satoshiToBtc(null)).toEqual(undefined)
      expect(convert.satoshiToBtc('')).toEqual(undefined)
    })
  })

  describe('toFixedFloor', function(){
    it('chops off digits', function(){
      expect(convert.toFixedFloor(10.1255, 2)).toEqual('10.12')
      expect(convert.toFixedFloor(10.1299, 2)).toEqual('10.12')
    })

    it('does not have precision issues', function(){
      expect(convert.toFixedFloor(-0.009, 5)).toEqual('-0.00900')
    })

    it('pads digits', function(){
      expect(convert.toFixedFloor(10, 2)).toEqual('10.00')
    })

    it('works for zero decimal', function(){
      expect(convert.toFixedFloor(10.98, 0)).toEqual('10')
    })
  })
})
