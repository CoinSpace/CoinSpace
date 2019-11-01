'use strict';

var Ractive = require('lib/ractive');

module.exports = function(el, date) {
  var now = new Date();
  var maxYear = now.getFullYear() - 18;
  var minYear = maxYear - 120;
  var years = [];
  for (var year = maxYear; year >= minYear; year--) {
    years.push(year);
  }

  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      years: years,
      days: [],
      selectedDay: 1,
      selectedMonth: 0,
      selectedYear: maxYear
    },
  });

  setDays();

  ractive.on('set-days', setDays);

  if (date) {
    ractive.set('selectedDay', date.getDate());
    ractive.set('selectedMonth', date.getMonth());
    ractive.set('selectedYear', date.getFullYear());
  }

  function setDays() {
    var year = ractive.get('selectedYear');
    var month = ractive.get('selectedMonth');
    var maxDays = new Date(year, month + 1, 0).getDate();
    var days = [];
    for (var day = 1; day <= maxDays; day++) {
      days.push(day);
    }
    ractive.set('days', days);
  }

  ractive.getBirthday = function() {
    var date = new Date(Date.UTC(
      this.get('selectedYear'),
      this.get('selectedMonth'),
      this.get('selectedDay')
    ));
    return date.toISOString();
  };

  return ractive;
}
