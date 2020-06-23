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

if (!['win', 'mac', 'mas', 'snap'].includes(program.platform)) {
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

webpackConfig.plugins.push(
  new webpack.DefinePlugin({
    'process.env.BUILD_TYPE': JSON.stringify('electron'),
    'process.env.BUILD_PLATFORM': JSON.stringify(program.platform),
    'process.env.SENTRY_DSN': JSON.stringify(process.env[`SENTRY_DSN_${program.platform.toUpperCase()}`]),
    'process.env.SENTRY_RELEASE': JSON.stringify(`${pkg.name}.electron-${program.platform}@${pkg.version}`),
  })
);

webpack(webpackConfig, function(error, stats) {
  if (error) return console.error(error);
  if (stats.hasErrors()) return console.log(stats.toString({ colors: true }));

  fse.removeSync(electronBuildPath);
  fse.copySync('build', path.resolve(electronBuildPath), { filter: utils.filterMapFiles });

  if (program.release) {
    // build electron to electron/dist
    console.log(`Start building (electron:${program.platform})...`);
    utils.shell('npm run publish', {
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
