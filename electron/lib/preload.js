const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  registerNavigateHandler: (callback) => ipcRenderer.on('navigate', (event, path) => callback(path)),
});
