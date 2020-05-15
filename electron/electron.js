'use strict';

// Assign env variables
Object.assign(process.env, require('./app/env.json'));

// Modules to control application life and create native browser window
const { app, Menu, protocol } = require('electron');
const openWindow = require('./lib/openWindow');

// Init crashReporter
const Sentry = require('@sentry/electron');
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT,
  release: process.env.SENTRY_RELEASE,
});

// Set up Application Menu
const menuTemplate = require('./lib/menu');
const menu = Menu.buildFromTemplate(menuTemplate);
Menu.setApplicationMenu(menu);

// Suppress deprecation warning
app.allowRendererProcessReuse = true;

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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
