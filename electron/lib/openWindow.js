'use strict';

const { shell, BrowserWindow } = require('electron');
const { isDevelopment } = require('./constants');

// Keep reference to IPC
let mainWindow;

function handleOpenURL(url) {
  if (mainWindow) {
    mainWindow.webContents.send('handleOpenURL', url);
  }
}

function openWindow(deeplink) {
  if (BrowserWindow.getAllWindows().length === 0) {
    // Create the browser window.
    mainWindow = new BrowserWindow({
      width: 500,
      height: 700,
      minWidth: 500,
      minHeight: 700,
      webPreferences: {
        devTools: isDevelopment,
        nodeIntegration: true,
      },
    });

    mainWindow.loadFile('./app/index.html');

    // Catch all attempts to open new window and open them in default browser
    mainWindow.webContents.on('new-window', (event, url, frameName, disposition, options) => {
      event.preventDefault();
      if (frameName === '_modal') {
        const [mainWindowWidth, mainWindowHeight] = mainWindow.getSize();
        Object.assign(options, {
          width: mainWindowWidth,
          height: mainWindowHeight,
          resizable: false,
          left: null,
          top: null,
          modal: true,
          parent: mainWindow,
          webPreferences: {
            sandbox: true,
          },
        });
        const modal = new BrowserWindow(options);
        modal.loadURL(url);
        event.newGuest = modal;
        return;
      }
      shell.openExternal(url);
    });
  } else {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
  }

  for (const child of mainWindow.getChildWindows()) {
    // Close modals
    child.close();
  }

  if (deeplink) {
    handleOpenURL(deeplink);
  }
}

module.exports = openWindow;
