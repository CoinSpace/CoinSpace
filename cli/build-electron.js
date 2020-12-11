#!/usr/bin/env node
'use strict';

const program = require('commander');
const fse = require('fs-extra');
const path = require('path');
const pkg = require('../package.json');
const utils = require('./utils');
const warning = require('chalk').yellow;
const webpack = require('webpack');
const dotenv = require('dotenv');
const electronBuildPath = 'electron/app';


program
  .name('build-electron.js')
  .option('-e, --env <env>', 'environment', 'dev')
  .option('--release', 'release mode')
  .option('--run', 'debug mode')
  .option('-p, --platform <platform>', 'platform', 'mac')
  .parse(process.argv);

if (!['win', 'appx', 'appx-dev', 'mac', 'mas', 'mas-dev', 'snap'].includes(program.platform)) {
  console.error(`Unsupported Platform: ${program.platform}`);
  process.exit(1);
}

console.log('Start building (webpack)...');

const envFile = `.env.${program.env}`;
console.log(`ENV_FILE: ${warning(envFile)}`);

dotenv.config({ path: envFile });
process.env['ENV_FILE'] = envFile;
process.env['ENV'] = program.env;
process.env['BUILD_TYPE'] = 'electron';
const webpackConfig = require('../webpack.prod');

const RELEASE = `${pkg.name}.electron-${program.platform}@${pkg.version}`;

webpackConfig.plugins.push(
  new webpack.DefinePlugin({
    'process.env.BUILD_TYPE': JSON.stringify('electron'),
    // use mas, appx app for mas-dev and appx-dev build
    'process.env.BUILD_PLATFORM': JSON.stringify(program.platform.replace('-dev', '')),
    'process.env.SENTRY_DSN': JSON.stringify(process.env['SENTRY_DSN']),
    'process.env.RELEASE': JSON.stringify(RELEASE),
  })
);

webpack(webpackConfig, (error, stats) => {
  if (error) throw error;
  if (stats.hasErrors()) {
    console.log(stats.toString({ colors: true }));
    throw new Error('stats errors');
  }

  fse.removeSync(electronBuildPath);
  fse.copySync('build', path.resolve(electronBuildPath), { filter: utils.filterMapFiles });

  if (program.release) {
    // build electron to electron/dist
    console.log(`Start building (electron:${program.platform})...`);
    let { platform } = program;

    if (program.platform === 'mac') {
      platform = 'darwin';
    }
    if (program.platform === 'mas' || program.platform === 'mas-dev') {
      platform = 'mas';
    }
    if (program.platform === 'win' || program.platform === 'appx' || program.platform === 'appx-dev') {
      platform = 'win32';
    }
    if (program.platform === 'snap') {
      platform = 'linux';
    }
    utils.shell(`npm run publish -- --platform=${platform}`, {
      cwd: './electron',
      env: {
        ...process.env,
        BUILD_PLATFORM: program.platform,
      },
    });
    console.log('Electron build Done!');
  } else if (program.run) {
    // run electron app
    console.log(`Debug Electron app building (electron:${program.platform})...`);
    utils.shell('npm start', {
      cwd: './electron',
      env: {
        ...process.env,
        BUILD_PLATFORM: program.platform,
      },
    });
    console.log('Stop electron run!');
  } else {
    console.log('Webpack build Done!');
  }
});
