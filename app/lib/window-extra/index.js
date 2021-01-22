'use strict';

const emitter = require('lib/emitter');

const windows = {};

emitter.on('handleOpenURL', (url) => {
  url = url || '';
  if (!url.startsWith('coinspace://')) return;
  const name = getParam(url, 'window');
  if (!windows[name]) return;

  let data = getParam(url, 'data');
  data = data ? JSON.parse(decodeURIComponent(data)) : '';

  const error = getParam(url, 'error');
  if (error) {
    windows[name].reject(new Error(decodeURIComponent(error)));
  } else {
    windows[name].resolve(data);
  }
});

function getParam(url, name) {
  const reg = new RegExp(name + '=([^&]+)');
  const matchAction = url.match(reg);
  return matchAction && matchAction[1];
}

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
