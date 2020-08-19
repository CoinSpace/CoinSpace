'use strict';

const Ractive = require('lib/ractive');

module.exports = function(el, date) {
  const now = new Date();
  const maxYear = now.getFullYear() - 18;
  const minYear = maxYear - 120;
  const years = [];
  for (let year = maxYear; year >= minYear; year--) {
    years.push(year);
  }

  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      months: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ],
      years,
      days: [],
      selectedDay: 1,
      selectedMonth: 0,
      selectedYear: maxYear,
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
    const year = ractive.get('selectedYear');
    const month = ractive.get('selectedMonth');
    const maxDays = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let day = 1; day <= maxDays; day++) {
      days.push(day);
    }
    ractive.set('days', days);
  }

  ractive.getBirthday = function() {
    const date = new Date(Date.UTC(
      this.get('selectedYear'),
      this.get('selectedMonth'),
      this.get('selectedDay')
    ));
    return date.toISOString();
  };

  return ractive;
};
