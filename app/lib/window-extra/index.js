'use strict';

const emitter = require('lib/emitter');
const querystring = require('querystring');

const windows = {};

emitter.on('handleOpenURL', (url) => {
  url = url || '';
  if (!url.startsWith('coinspace://')) return;

  const params = querystring.parse(url.split('?')[1]);
  const { window, error } = params;
  let { data } = params;
  if (!windows[window]) return;
  data = data ? JSON.parse(data) : '';
  if (error) {
    windows[window].reject(new Error(error));
  } else {
    windows[window].resolve(data);
  }
});

function open(options) {
  let promiseResolve;
  let promiseReject;
  const promise = new Promise((resolve, reject) => {
    const width = options.width || 500;
    const height = options.height || 600;
    let features = 'width=' + width + ', ';
    features += 'height=' + height + ', ';
    features += 'left=' + ((screen.width - width) / 2) + ', ';
    features += 'top=' + ((screen.height - height) / 2) + '';

    window.open(options.url, options.target || '_blank', features);
    promiseResolve = resolve;
    promiseReject = reject;
  });
  promise.resolve = promiseResolve;
  promise.reject = promiseReject;
  windows[options.name] = promise;
  return promise;
}

module.exports = {
  open,
};
