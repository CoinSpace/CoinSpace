'use strict';

const Ractive = require('lib/ractive');

module.exports = function(el, options, selectedOption) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      options,
      getLabel(code) {
        const option = options.find((item) => {
          return item.code === code;
        });
        return option ? option.name : '';
      },
      selectedOption,
    },
  });

  ractive.getValue = function() {
    return this.get('selectedOption');
  };

  return ractive;
};
