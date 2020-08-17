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

if (program.run && program.platform === 'android') {
  return cordova('run android --noprepare');
}

console.log('Start building (webpack)...');

const envFile = `.env.${program.env}`;
dotenv.config({ path: envFile });
process.env['ENV_FILE'] = envFile;
process.env['ENV'] = program.env;
process.env['BUILD_TYPE'] = 'phonegap';
const webpackConfig = require('../webpack.prod');

const SENTRY_RELEASE = `${pkg.name}.${program.platform}@${pkg.version}`;

webpackConfig.plugins.push(
  new webpack.DefinePlugin({
    'process.env.BUILD_TYPE': JSON.stringify('phonegap'),
    'process.env.BUILD_PLATFORM': JSON.stringify(program.platform),
    'process.env.SENTRY_RELEASE': JSON.stringify(SENTRY_RELEASE),
    'process.env.SENTRY_DSN': JSON.stringify(process.env['SENTRY_DSN']),
  })
);

webpack(webpackConfig, function(error, stats) {
  if (error) throw error;
  if (stats.hasErrors()) {
    console.log(stats.toString({ colors: true }));
    throw new Error('stats errors');
  }

  fse.removeSync(mobileBuildPath);
  fse.copySync('build', path.resolve(mobileBuildPath, 'www'), { filter: utils.filterMapFiles });

  console.log(`Start building (phonegap:${program.platform})...`);

  utils.shell(`npm run ${program.platform}`, {
    cwd: './phonegap',
    env: {
      ...process.env,
      RELEASE: program.release
    },
  });

  if (program.release) {
    utils.uploadSentrySourceMaps(program.platform, SENTRY_RELEASE);
  }
  console.log('Done!');
});
