'use strict';

var Ractive = require('lib/ractive');

module.exports = function(el, options, selectedOption) {
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      options: options,
      getLabel: function(code) {
        var option = options.find(function(item) {
          return item.code === code;
        });
        return option ? option.name : '';
      },
      selectedOption: selectedOption,
    },
  });

  ractive.getValue = function() {
    return this.get('selectedOption');
  };

  return ractive;
}
