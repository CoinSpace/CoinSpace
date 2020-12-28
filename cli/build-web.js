#!/usr/bin/env node
'use strict';

const program = require('commander');
const warning = require('chalk').yellow;
const webpack = require('webpack');
const pkg = require('../package.json');
const dotenv = require('dotenv');
const utils = require('./utils');

program
  .name('build-web.js')
  .option('-e, --env <env>', 'environment', 'dev')
  .option('--release', 'release mode')
  .option('-p, --platform <platform>', 'platform', 'web')
  .parse(process.argv);

const envFile = `.env.${program.env}`;
dotenv.config({ path: envFile });
console.log(`ENV_FILE: ${warning(envFile)}`);
console.log('Start building (webpack)...');

process.env['ENV_FILE'] = envFile;
process.env['ENV'] = program.env;
process.env['BUILD_TYPE'] = 'web';
process.env['BUILD_PLATFORM'] = program.platform;

const webpackConfig = require('../webpack.prod');

const RELEASE = `${pkg.name}.web-${program.platform}@${pkg.version}`;

webpackConfig.plugins.push(
  new webpack.DefinePlugin({
    'process.env.BUILD_TYPE': JSON.stringify('web'),
    'process.env.BUILD_PLATFORM': JSON.stringify(program.platform),
    'process.env.RELEASE': JSON.stringify(RELEASE),
    'process.env.SENTRY_DSN': JSON.stringify(process.env.SENTRY_DSN),
  })
);

webpack(webpackConfig, (error, stats) => {
  if (error) throw error;
  if (stats.hasErrors()) {
    console.log(stats.toString({ colors: true }));
    throw new Error('stats errors');
  }
  if (program.release) {
    utils.uploadSentrySourceMaps(program.platform, RELEASE);
  }
  console.log('Done!');
});


