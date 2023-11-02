import { fileURLToPath } from 'node:url';
import log from 'electron-log';
import { BrowserWindow, shell } from 'electron';

import {
  APP_HOSTNAME,
  isDevelopment,
} from './constants.js';

function makePath(deeplink) {
  if (deeplink) {
    return `/bip21/${encodeURIComponent(deeplink)}`;
  } else {
    return '/';
  }
}

export default function openWindow(deeplink) {
  const path = makePath(deeplink);
  log.info(`open deeplink: '${deeplink}' path: '${path}'`);
  if (BrowserWindow.getAllWindows().length === 0) {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
      width: 500,
      height: 700,
      minWidth: 500,
      minHeight: 700,
      webPreferences: {
        devTools: isDevelopment,
        preload: fileURLToPath(new URL('preload.js', import.meta.url)),
      },
    });
    mainWindow.loadURL(`https://${APP_HOSTNAME}/#${path}`);

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
    if (deeplink) {
      log.info(`navigate: '${path}'`);
      mainWindow.webContents.send('navigate', path);
    }
    return mainWindow;
  }
}
