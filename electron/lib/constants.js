import * as variables from '../dist/variables.js';

const mode = process.env.NODE_ENV || variables.MODE;
export const isMac = process.platform === 'darwin';
export const isLinux = process.platform === 'linux';
export const isWindows = process.platform === 'win32';
export const isDevelopment = mode === 'development';
export const isMas = process.mas === true;
export const isWindowsStore = process.windowsStore === true;
export const APP_HOSTNAME = new URL(variables.VITE_SITE_URL).hostname;
export * from '../dist/variables.js';
