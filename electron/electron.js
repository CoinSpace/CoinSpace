'use strict';

// Assign env variables
Object.assign(process.env, require('./app/env.json'));

// Modules to control application life and create native browser window
const path = require('path');
const { app, Menu, protocol } = require('electron');
const log = require('electron-log');
const pkg = require('./package.json');
const { isMac, isMas, isWindows, isLinux } = require('./lib/constants');
const menuTemplate = require('./lib/menu');
const openWindow = require('./lib/openWindow');
const Sentry = require('@sentry/electron');
const schemes = require('./lib/schemes');
const updater = require('./lib/updater');

if (process.env.NODE_ENV === 'production') {
  log.transports.file.level = false;
}

log.log('versions', process.versions);

if (require('electron-squirrel-startup')) return;

// Suppress deprecation warning
app.allowRendererProcessReuse = true;

if (isWindows) {
  app.setAboutPanelOptions({
    iconPath: path.join(__dirname, 'resources/64x64.png'),
  });
}

if (isLinux) {
  app.setAboutPanelOptions({
    applicationName: app.name,
    applicationVersion: app.getVersion(),
    website: pkg.homepage,
    iconPath: path.join(__dirname, 'resources/64x64.png'),
  });
}

let startupUrl;
const lock = app.requestSingleInstanceLock();

// https://github.com/electron/electron/issues/15958
if (!isMas && !lock) {
  app.quit();
  return;
}

// Init crashReporter
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.RELEASE,
});

// Set up Application Menu
const menu = Menu.buildFromTemplate(menuTemplate);
Menu.setApplicationMenu(menu);

schemes.forEach((item) => {
  if (!app.isDefaultProtocolClient(item.scheme)) {
    // Define custom protocol handler. Deep linking works on packaged versions of the application!
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

// Someone tried to run a second instance
app.on('second-instance', (event, argv) => {
  openWindow(extractUrlFromArgv(argv));
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  log.log('app ready');
  protocol.registerStringProtocol('coinspace', (request/*, cb*/) => {
    openWindow(request.url);
    // no calback due to bug
    // https://github.com/electron/electron/issues/28407
    // https://github.com/electron/electron/issues/28579
    //cb('ok');
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

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
