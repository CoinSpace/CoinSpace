'use strict';

const { execSync } = require('child_process');
const chalk = require('chalk');
const path = require('path');
const cordovaPath = path.resolve(__dirname, '../phonegap/node_modules/.bin/', 'cordova');
const sentryPath = path.resolve(__dirname, '../node_modules/.bin/', 'sentry-cli');

function shell(command, options) {
  console.log(`Executing: ${chalk.green(command)}`);
  const defaultOptions = { stdio: [0, 1, 2] };
  execSync(command, Object.assign(defaultOptions, options));
}

function cordova(cwd) {
  return function(command) {
    shell(`${cordovaPath} ${command}`, { cwd });
  };
}

function filterMapFiles(src) {
  return !src.endsWith('.map');
}

function uploadSentrySourceMaps(project, release) {
  shell(`${sentryPath} releases -p ${project} new ${release}`);
  // eslint-disable-next-line max-len
  shell(`${sentryPath} releases -p ${project} files ${release} upload-sourcemaps --no-rewrite --url-prefix / ./build/assets/js`);
}

module.exports = {
  shell,
  cordova,
  filterMapFiles,
  uploadSentrySourceMaps,
};
