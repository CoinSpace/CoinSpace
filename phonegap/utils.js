import chalk from 'chalk';
import { execSync } from 'child_process';
import path from 'path';

const cordovaPath = path.resolve('./node_modules/.bin/', 'cordova');

export function cordova(cwd) {
  return function(command) {
    shell(`${cordovaPath} ${command}`, { cwd });
  };
}

export function shell(command, options) {
  console.log(`Executing: ${chalk.green(command)}`);
  const defaultOptions = { stdio: [0, 1, 2] };
  execSync(command, Object.assign(defaultOptions, options));
}
