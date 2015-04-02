function transifexFormatToRfc4646(txCode) {
  var langRegionScript = txCode.split(/[_|@]/)
  if(langRegionScript.length == 1) {
    return langRegionScript[0]
  } else if(langRegionScript.length == 2) {
    if(txCode.indexOf('@')) {
      langRegionScript[1] = unifyLatin(langRegionScript[1])
    }
    return langRegionScript.join('-')
  } else {
    var code = [langRegionScript[0], unifyLatin(langRegionScript[2]), langRegionScript[1]]
    return code.join('-')
  }
}

function unifyLatin(script) {
  return script.replace(/[l|L]atin/, 'Latn')
}

module.exports = transifexFormatToRfc4646
