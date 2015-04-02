var transifexFormatToRfc4646 = require('../index')

describe('transifexFormatToRfc4646', function(){
  it('works for regular cases', function(){
    expect(transifexFormatToRfc4646('en')).toEqual('en')
    expect(transifexFormatToRfc4646('zh_CN')).toEqual('zh-CN')
    expect(transifexFormatToRfc4646('it_IT')).toEqual('it-IT')
  })

  it('works for @latin', function(){
    expect(transifexFormatToRfc4646('sr_RS@latin')).toEqual('sr-Latn-RS')
    expect(transifexFormatToRfc4646('az@latin')).toEqual('az-Latn')
    expect(transifexFormatToRfc4646('ug@Latin')).toEqual('ug-Latn')
  })

  it('works for regular @script', function(){
    expect(transifexFormatToRfc4646('uz@Cyrl')).toEqual('uz-Cyrl')
    expect(transifexFormatToRfc4646('uz@Latn')).toEqual('uz-Latn')
  })
})
