import { fileURLToPath } from 'node:url';
import { init } from '@sentry/electron';
import log from 'electron-log';
import { Menu, app, net, protocol } from 'electron';

import menu from './lib/menu.js';
import openWindow from './lib/openWindow.js';
import schemes from './dist/schemes.js';
import updater from './lib/updater.js';
import {
  APP_HOSTNAME,
  VITE_SENTRY_DSN,
  VITE_SENTRY_ENVIRONMENT,
  VITE_SITE_URL,
  isDevelopment,
  isLinux,
  isMac,
  isMas,
  isWindows,
  release,
} from './lib/constants.js';

if (!isDevelopment) {
  log.transports.file.level = false;
}

log.info('versions', process.versions);

if (isWindows) {
  app.setAboutPanelOptions({
    iconPath: fileURLToPath(new URL('./resources/64x64.png', import.meta.url)),
  });
}

if (isLinux) {
  app.setAboutPanelOptions({
    applicationName: app.name,
    applicationVersion: app.getVersion(),
    website: VITE_SITE_URL,
    iconPath: fileURLToPath(new URL('./resources/64x64.png', import.meta.url)),
  });
}

let startupUrl;
const lock = app.requestSingleInstanceLock();

// https://github.com/electron/electron/issues/15958
if (!isMas && !lock) {
  app.quit();
  //return;
}

// Init crashReporter
init({
  dsn: VITE_SENTRY_DSN,
  environment: VITE_SENTRY_ENVIRONMENT,
  release,
});

// Set up Application Menu
Menu.setApplicationMenu(menu);

[...schemes, { scheme: 'coinspace' }].forEach((item) => {
  if (!app.isDefaultProtocolClient(item.scheme)) {
    // Define custom protocol handler.
    // Deep linking works on packaged versions of the application!
    app.setAsDefaultProtocolClient(item.scheme);
  }
});

// The application has finished basic startup
app.on('will-finish-launching', () => {
  // Protocol handler for macOS
  app.on('open-url', (event, url) => {
    event.preventDefault();
    if (app.isReady()) {
      openWindow(url);
    } else {
      startupUrl = url;
    }
  });
});

function extractUrlFromArgv(argv) {
  return argv.find(arg => {
    return schemes.some((item) => arg.startsWith(`${item.scheme}:`));
  });
}

function shouldHandlePathname(pathname) {
  if (pathname.startsWith('/api/')) return false;
  if (pathname.startsWith('/assets/crypto/')) return false;
  return true;
}

// Someone tried to run a second instance
app.on('second-instance', (event, argv) => {
  openWindow(extractUrlFromArgv(argv));
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (!isMac) {
    app.quit();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  log.info('app ready');

  // handle local files
  protocol.handle('https', (req) => {
    const { host, pathname } = new URL(req.url);
    if (host === APP_HOSTNAME && shouldHandlePathname(pathname)) {
      const url = new URL(`dist${pathname === '/' ? '/index.html' : pathname}`, import.meta.url);
      return net.fetch(url);
    }
    return net.fetch(req, { bypassCustomProtocolHandlers: true });
  });

  if (isMac) {
    openWindow(startupUrl);
  } else {
    openWindow(extractUrlFromArgv(process.argv));
  }

  updater.launchCheckForUpdates();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    openWindow();
  });
});
