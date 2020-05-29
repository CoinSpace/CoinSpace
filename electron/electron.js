'use strict';

// Assign env variables
Object.assign(process.env, require('./app/env.json'));

// Modules to control application life and create native browser window
const path = require('path');
const { app, Menu, protocol } = require('electron');
const pkg = require('./package.json');
const { isMas, isWindows, isLinux } = require('./lib/constants');
const menuTemplate = require('./lib/menu');
const openWindow = require('./lib/openWindow');
const Sentry = require('@sentry/electron');

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

function init() {
  const lock = app.requestSingleInstanceLock();

  // https://github.com/electron/electron/issues/15958
  if (!isMas && !lock) {
    app.quit();
    return;
  }

  // Init crashReporter
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT,
    release: process.env.SENTRY_RELEASE,
  });

  // Set up Application Menu
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  if (!app.isDefaultProtocolClient('coinspace')) {
    // Define custom protocol handler. Deep linking works on packaged versions of the application!
    app.setAsDefaultProtocolClient('coinspace');
  }

  // TODO add autoupdater

  // The application has finished basic startup
  app.on('will-finish-launching', () => {
    // Protocol handler for macOS
    app.on('open-url', (event, url) => {
      event.preventDefault();
      openWindow(url);
    });
  });

  // Someone tried to run a second instance
  app.on('second-instance', (event, argv) => {
    openWindow(argv.find(item => item.startsWith('coinspace')));
  });

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', () => {
    protocol.registerStringProtocol('coinspace', (request, cb) => {
      openWindow(request.url);
      cb('ok');
    });
    openWindow();
  });

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    openWindow();
  });
}

init();
