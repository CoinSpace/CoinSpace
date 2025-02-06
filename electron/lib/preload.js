const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  registerNavigateHandler: (callback) => ipcRenderer.on('navigate', (event, path) => callback(path)),
  arch: process.arch,
  getCurrentPosition(success, error, options) {
    ipcRenderer.invoke('geolocation', options).then(success, error);
  },
});
