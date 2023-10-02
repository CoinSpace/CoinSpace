const windows = {};

function handleOpenURL(url = '') {
  const params = new URLSearchParams(url.split('?')[1]);
  const window = params.get('window');
  const error = params.get('error');
  if (!windows[window]) return;
  if (error) {
    const { message, name } = JSON.parse(error);
    const err = new Error(message);
    if (name) err.name = name;
    windows[window].reject(err);
  } else {
    let data = params.get('data');
    data = data ? JSON.parse(data) : '';
    windows[window].resolve(data);
  }
}

function open(options) {
  let promiseResolve;
  let promiseReject;
  const promise = new Promise((resolve, reject) => {
    const target = import.meta.env.VITE_BUILD_TYPE === 'electron' ? '_modal' : '_system';
    const width = options.width || 500;
    const height = options.height || 600;
    let features = 'width=' + width + ', ';
    features += 'height=' + height + ', ';
    features += 'left=' + ((screen.width - width) / 2) + ', ';
    features += 'top=' + ((screen.height - height) / 2) + '';
    window.open(options.url, target, features);
    promiseResolve = resolve;
    promiseReject = reject;
  });
  promise.resolve = promiseResolve;
  promise.reject = promiseReject;
  windows[options.name] = promise;
  return promise;
}

export default {
  handleOpenURL,
  open,
};
