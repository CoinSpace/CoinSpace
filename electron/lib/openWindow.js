import { fileURLToPath } from 'url';
import log from 'electron-log';
import { BrowserWindow, shell } from 'electron';

import schemes from './schemes.js';
import {
  APP_HOSTNAME,
  isDevelopment,
} from './constants.js';

function makePath(deeplink) {
  if (deeplink && schemes.some((item) => deeplink.startsWith(`${item.scheme}:`))) {
    const crypto = schemes.find((item) => deeplink.startsWith(`${item.scheme}:`));
    return `${crypto._id}/bip21/${encodeURIComponent(deeplink)}`;
  } else {
    return '';
  }
}

function getWindow(path) {
  if (BrowserWindow.getAllWindows().length === 0) {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
      width: 500,
      height: 700,
      minWidth: 500,
      minHeight: 700,
      webPreferences: {
        devTools: isDevelopment,
        //nodeIntegration: true,
        //contextIsolation: false,
        preload: fileURLToPath(new URL('preload.js', import.meta.url)),
      },
    });
    mainWindow.loadURL(`https://${APP_HOSTNAME}/#/${path}`);

    // Catch all attempts to open new window and open them in default browser
    mainWindow.webContents.on('new-window', (event, url/*, frameName, disposition, options*/) => {
      event.preventDefault();
      /*
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
      */
      shell.openExternal(url);
    });
    return mainWindow;
  } else {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
    return mainWindow;
  }
}

export default function openWindow(deeplink) {
  log.info(`open deeplink: '${deeplink}'`);
  const path = makePath(deeplink);
  log.info(`open path: '${path}'`);
  const mainWindow = getWindow(path);
  if (deeplink) {
    mainWindow.webContents.send('navigate', path);
  }
}
