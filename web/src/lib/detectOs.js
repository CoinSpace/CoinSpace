const platforms = [
  {
    os: 'android',
    userAgent: /android/i,
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
  },
];

let detectOs = 'unknown';
const found = platforms.find((target) => {
  if (target.userAgent) {
    return target.userAgent.test(window.navigator.userAgent);
  }
  return target.platform.test(window.navigator.platform);
});
if (found) detectOs = found.os;

export default detectOs;

export const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(window.navigator.userAgent);
