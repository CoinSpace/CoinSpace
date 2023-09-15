const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  navigate: (callback) => ipcRenderer.on('navigate', callback),
});
