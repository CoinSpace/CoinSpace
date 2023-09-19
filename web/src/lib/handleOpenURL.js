
export default function handleOpenURL(account) {
  if (import.meta.env.VITE_BUILD_TYPE === 'phonegap') {
    window.handleOpenURL = function(url) {
      const { SafariViewController } = window;
      SafariViewController.hide();
      setTimeout(() => {
        account.emit('handleOpenURL', url);
      }, 1);
    };
  }

  if (import.meta.env.VITE_BUILD_TYPE === 'web') {
    window.handleOpenURL = function(url) {
      setTimeout(() => {
        account.emit('handleOpenURL', url);
      }, 1);
    };
  }

  if (import.meta.env.VITE_BUILD_TYPE === 'electron') {
    // TODO
    // const { ipcRenderer } = require('electron');
    // ipcRenderer.on('handleOpenURL', (event, url) => {
    //   account.emit('handleOpenURL', url);
    // });
  }
}
