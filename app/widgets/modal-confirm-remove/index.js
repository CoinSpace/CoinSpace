'use strict';

var Ractive = require('widgets/modal');
var emitter = require('lib/emitter');
var showError = require('widgets/modal-flash').showError;

function open(data) {

  data.confirmation = true;

  var ractive = new Ractive({
    partials: {
      content: require('./_content.ract')
    },
    data: data
  });

  ractive.on('remove', function(){
    ractive.set('removing', true);

    // error
    // showError({message: 'some error'});
    // ractive.set('removing', false);

    // success
    ractive.set('confirmation', false);
    ractive.set('success', true);
  });

  ractive.on('reload', function() {
    console.log('reload');
  });

  return ractive;
}

module.exports = open
