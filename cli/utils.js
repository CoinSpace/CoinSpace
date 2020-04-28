'use strict';

var execSync = require('child_process').execSync;
var chalk = require('chalk');
var path = require('path');
var cordovaPath = path.resolve(__dirname, '../node_modules/.bin/', 'cordova');
var sentryPath = path.resolve(__dirname, '../node_modules/.bin/', 'sentry-cli');
var mobileBuildPath = 'phonegap/build';

function shell(command, options) {
  console.log(`Executing: ${chalk.green(command)}`);
  var defaultOptions = {stdio: [0,1,2]};
  execSync(command, Object.assign(defaultOptions, options));
}

function cordova(command) {
  shell(`${cordovaPath} ${command}`, {cwd: mobileBuildPath});
}

function filterMapFiles(src) {
  return !src.endsWith('.map');
}

function uploadSentrySourceMaps(project, release) {
  shell(`${sentryPath} releases -p ${project} new ${release}`);
  shell(`${sentryPath} releases -p ${project} files ${release} delete --all`);
  // eslint-disable-next-line max-len
  shell(`${sentryPath} releases -p ${project} files ${release} upload-sourcemaps --no-rewrite --url-prefix '/' ./build/assets/js`);
}

module.exports = {
  shell: shell,
  cordova: cordova,
  filterMapFiles: filterMapFiles,
  uploadSentrySourceMaps: uploadSentrySourceMaps,
};
