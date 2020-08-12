#!/usr/bin/env node
'use strict';

var program = require('commander');
var warning = require('chalk').yellow;
var webpack = require('webpack');
var pkg = require('../package.json');
var dotenv = require('dotenv');
var utils = require('./utils');
var SENTRY_RELEASE = `${pkg.name}.web@${pkg.version}`;

program
  .name('build-web.js')
  .option('-e, --env <env>', 'environment', 'dev')
  .option('--release', 'release mode')
  .parse(process.argv);

var envFile = `.env.${program.env}`;
dotenv.config({ path: envFile });
console.log(`ENV_FILE: ${warning(envFile)}`);
console.log('Start building (webpack)...');

process.env['ENV_FILE'] = envFile;
process.env['ENV'] = program.env;
process.env['BUILD_TYPE'] = 'web';

var webpackConfig = require('../webpack.prod');

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


