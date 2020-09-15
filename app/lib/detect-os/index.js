'use strict';

const platforms = [
  {
    os: 'android',
    platform: /android.*/i,
  },
  {
    os: 'ios',
    platform: /(iphone|ipod|ipad)/i,
  },
  {
    os: 'windows',
    platform: /win.*/i,
  },
  {
    os: 'macos',
    platform: /mac.*/i,
  },
  {
    os: 'linux',
    platform: /linux.*/i,
  }
];

let os = 'unknown';
let found = platforms.find(target => target.platform.test(window.navigator.platform))
if (found) os = found.os;

module.exports = os;
