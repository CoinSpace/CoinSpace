var glob = require( 'glob' );
var fs = require('fs');

glob(process.argv[2], function (err, files) {
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    var buf = fs.readFileSync(file);
    var missingBOM = (buf[0] !== 0xEF && buf[1] !== 0xBE && buf[2] !== 0xBB)
    if (missingBOM) {
      fs.writeFileSync(file, '\ufeff' + buf);
      console.log('BOM added: ' + file)
    } else {
      console.log('BOM skipped: ' + file)
    }
  }
});