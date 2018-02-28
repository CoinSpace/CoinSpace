'use strict';

var execSync = require('child_process').execSync;
var chalk = require('chalk');
var path = require('path');
var cordovaPath = path.resolve(__dirname, '../node_modules/.bin/', 'cordova');
var mobileBuildPath = 'phonegap/build';

var yesno = {
  name: 'yesno',
  message: 'are you sure?',
  validator: /y[es]*|no$/,
  warning: 'Must respond yes or no',
  default: 'no'
};

function shell(command, options) {
  console.log(`Executing: ${chalk.green(command)}`);
  var defaultOptions = {stdio: [0,1,2]};
  execSync(command, Object.assign(defaultOptions, options));
}

function cordova(command) {
  shell(`${cordovaPath} ${command}`, {cwd: mobileBuildPath});
}

module.exports = {
  prompts: {
    yesno: yesno
  },
  shell: shell,
  cordova: cordova,
};
