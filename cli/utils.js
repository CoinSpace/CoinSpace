'use strict'

var execSync = require('child_process').execSync;
var chalk = require('chalk');

var yesno = {
  name: 'yesno',
  message: 'are you sure?',
  validator: /y[es]*|no$/,
  warning: 'Must respond yes or no',
  default: 'no'
};

function shell(command) {
  console.log(`Executing: ${chalk.green(command)}`);
  execSync(command, {stdio: [0,1,2]});
}

module.exports = {
  prompts: {
    yesno: yesno
  },
  shell: shell
};
