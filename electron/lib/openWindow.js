'use strict';

const { shell, BrowserWindow, BrowserView } = require('electron');
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
          webPreferences: {
            sandbox: true,
          },
        });
        const modal = new BrowserView(options);
        // https://github.com/electron/electron/issues/24833
        //event.newGuest = modal;
        mainWindow.setBrowserView(modal);
        // fix options in constructor
        modal.setBounds({
          x: 0,
          y: 0,
          width: mainWindowWidth,
          height: mainWindowHeight,
        });
        modal.setAutoResize({
          width: true,
          height: true,
          horizontal: true,
          vertical: true,
        });
        // fix transparent background
        modal.setBackgroundColor('#fff');
        modal.webContents.loadURL(url);
        return;
      }
      shell.openExternal(url);
    });
  } else {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.show();

      for (const child of mainWindow.getChildWindows()) {
        // Close modals
        child.close();
      }

      for (const view of mainWindow.getBrowserViews()) {
        mainWindow.removeBrowserView(view);
        view.destroy();
      }
    }
  }

  if (deeplink) {
    handleOpenURL(deeplink);
  }
}

module.exports = openWindow;
