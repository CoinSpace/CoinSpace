'use strict';

const emitter = require('lib/emitter');

const windows = {};

emitter.on('handleOpenURL', (url) => {
  url = url || '';
  const name = getParam(url, 'window');
  if (!windows[name]) return;

  let data = getParam(url, 'data');
  data = data ? JSON.parse(decodeURIComponent(data)) : '';

  windows[name].resolve(data);
});

function getParam(url, name) {
  const reg = new RegExp(name + '=([^&]+)');
  const matchAction = url.match(reg);
  return matchAction && matchAction[1];
}

function open(options) {
  let promiseResolve;
  const promise = new Promise((resolve) => {
    const width = options.width || 500;
    const height = options.height || 600;
    let features = 'width=' + width + ', ';
    features += 'height=' + height + ', ';
    features += 'left=' + ((screen.width - width) / 2) + ', ';
    features += 'top=' + ((screen.height - height) / 2) + '';

    window.open(options.url, options.target || '_blank', features);
    promiseResolve = resolve;
  });
  promise.resolve = promiseResolve;
  windows[options.name] = promise;
  return promise;
}

module.exports = {
  open,
};
