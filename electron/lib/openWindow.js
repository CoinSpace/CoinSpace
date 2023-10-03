import { fileURLToPath } from 'node:url';
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
    return `/${crypto._id}/bip21/${encodeURIComponent(deeplink)}`;
  } else {
    return '/';
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

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
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
