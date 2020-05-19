'use strict';

module.exports = {
  isMac: process.platform === 'darwin',
  isLinux: process.platform === 'linux',
  isWindows: process.platform === 'win32',
  isDevelopment: process.env.NODE_ENV === 'development',
  isMas: process.mas === true,
  isWindowsStore: process.windowsStore === true,
};
