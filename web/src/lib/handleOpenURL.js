
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

  if (import.meta.env.VITE_BUILD_TYPE === 'web' && import.meta.env.DEV) {
    window.handleOpenURL = function(url) {
      setTimeout(() => {
        account.emit('handleOpenURL', url);
      }, 1);
    };
  }
}
