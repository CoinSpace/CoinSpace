'use strict';

// Modules to control application life and create native browser window
const { app, shell, BrowserWindow, protocol } = require('electron');

// Keep reference to IPC
let mainWindow;

function handleOpenURL(url) {
  if (mainWindow) {
    mainWindow.webContents.send('handleOpenURL', url);
  }
}

if (!app.isDefaultProtocolClient('coinspace')) {
  // Define custom protocol handler. Deep linking works on packaged versions of the application!
  app.setAsDefaultProtocolClient('coinspace');
}

// TODO add autoupdater

function createWindow() {
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

  protocol.registerStringProtocol('coinspace', (request, cb) => {
    handleOpenURL(request.url);
    cb('ok');
  });

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
    if (frameName === '_modal') {
      const [mainWindowWidth, mainWindowHeight] = mainWindow.getSize();
      event.preventDefault();
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

    event.preventDefault();
    shell.openExternal(url);
  });
}

// The application has finished basic startup
app.on('will-finish-launching', () => {
  // Protocol handler for macOS
  app.on('open-url', (event, url) => {
    event.preventDefault();
    handleOpenURL(url);
  });
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

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
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
