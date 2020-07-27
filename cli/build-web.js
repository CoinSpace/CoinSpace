#!/usr/bin/env node
'use strict';

const program = require('commander');
const warning = require('chalk').yellow;
const webpack = require('webpack');
const pkg = require('../package.json');
const dotenv = require('dotenv');
const utils = require('./utils');
const SENTRY_RELEASE = `${pkg.name}.web@${pkg.version}`;

program
  .name('build-web.js')
  .option('-e, --env <env>', 'environment', 'dev')
  .option('--release', 'release mode')
  .parse(process.argv);

const envFile = `.env.${program.env}`;
dotenv.config({ path: envFile });
console.log(`ENV_FILE: ${warning(envFile)}`);
console.log('Start building (webpack)...');

process.env['ENV_FILE'] = envFile;
process.env['ENV'] = program.env;
process.env['BUILD_TYPE'] = 'web';

const webpackConfig = require('../webpack.prod');

webpackConfig.plugins.push(
  new webpack.DefinePlugin({
    'process.env.BUILD_TYPE': JSON.stringify('web'),
    'process.env.SENTRY_RELEASE': JSON.stringify(SENTRY_RELEASE),
    'process.env.SENTRY_DSN': JSON.stringify(process.env.SENTRY_DSN),
  })
);

webpack(webpackConfig, function(error, stats) {
  if (error) throw error;
  if (stats.hasErrors()) {
    console.log(stats.toString({ colors: true }));
    throw new Error('stats errors');
  }
  if (program.release) {
    utils.uploadSentrySourceMaps('web', SENTRY_RELEASE);
  }
  console.log('Done!');
});


