import Clipboard from 'clipboard';

function init(ractive, selector, isCopied) {
  if (!Clipboard.isSupported()) return;
  const clipboard = new Clipboard(ractive.find(selector));
  let isRunning = false;
  clipboard.on('success', () => {
    if (isRunning) return;
    isRunning = true;
    ractive.set(isCopied, true);
    setTimeout(() => {
      isRunning = false;
      ractive.set(isCopied, false);
    }, 1000);
  });
  return clipboard;
}

export default init;
