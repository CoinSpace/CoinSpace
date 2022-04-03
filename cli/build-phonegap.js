#!/usr/bin/env node
'use strict';

const program = require('commander');
const fse = require('fs-extra');
const path = require('path');
const pkg = require('../package.json');
const utils = require('./utils');
const webpack = require('webpack');
const dotenv = require('dotenv');
const mobileBuildPath = 'phonegap/build';
const cordova = utils.cordova(mobileBuildPath);

program
  .name('build-phonegap.js')
  .option('-e, --env <env>', 'environment', 'prod')
  .option('--release', 'release mode')
  .option('--run', 'run app')
  .option('-p, --platform <platform>', 'platform')
  .parse(process.argv);

if (program.run && program.platform.startsWith('android')) {
  cordova('run android --noprepare');
  process.exit(0);
}

console.log('Start building (webpack)...');

const envFile = `.env.${program.env}`;
dotenv.config({ path: envFile });
process.env['ENV_FILE'] = envFile;
process.env['ENV'] = program.env;
process.env['BUILD_TYPE'] = 'phonegap';
process.env['BUILD_PLATFORM'] = program.platform;
const webpackConfig = require('../webpack.prod');

const RELEASE = `${pkg.name}.phonegap-${program.platform}@${pkg.version}`;
const PLATFORM = `phonegap-${program.platform}`;

webpackConfig.plugins.push(
  new webpack.DefinePlugin({
    'process.env.RELEASE': JSON.stringify(RELEASE),
    'process.env.PLATFORM': JSON.stringify(PLATFORM),
  })
);

webpack(webpackConfig, (error, stats) => {
  utils.webpackResultHandler(error, stats);

  fse.removeSync(mobileBuildPath);
  fse.copySync('build', path.resolve(mobileBuildPath, 'www'), { filter: utils.filterMapFiles });

  console.log(`Start building (phonegap:${program.platform})...`);

  let { platform } = program;
  if (program.platform === 'android-play') {
    platform = 'android';
  }
  if (program.platform === 'android-galaxy') {
    platform = 'android';
  }

  utils.shell(`npm run ${platform}`, {
    cwd: './phonegap',
    env: {
      ...process.env,
      RELEASE: program.release,
    },
  });

  if (program.release) {
    utils.uploadSentrySourceMaps(platform, RELEASE);
  }
  console.log('Done!');
});
