'use strict';

const { shell, BrowserWindow } = require('electron');

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
        devTools: process.env.NODE_ENV === 'development',
        nodeIntegration: true,
      },
    });

    mainWindow.loadFile('./app/index.html');

    // set api.moonpay.io cookies
    mainWindow.webContents.session.cookies.set({
      url: 'https://api.moonpay.io',
      name: 'customerToken',
      value: '',
      domain: 'api.moonpay.io',
      expirationDate: 9999999999,
    });

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
  }

  if (deeplink) {
    handleOpenURL(deeplink);
  }
}

module.exports = openWindow;
