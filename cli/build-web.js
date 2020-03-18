#!/usr/bin/env node

var program = require('commander');
var warning = require('chalk').yellow;
var webpack = require('webpack');
var package = require('../package.json');
var dotenv = require('dotenv');
var utils = require('./utils');
var SENTRY_RELEASE = `${package.name}.web@${package.version}`;

program
  .name('build-web.js')
  .option('-e, --env <env>', 'environment', 'dev')
  .option('--release', 'release mode')
  .parse(process.argv);

var currentDockerMachine = process.env.DOCKER_MACHINE_NAME ? process.env.DOCKER_MACHINE_NAME : 'local';
var envFile = `.env.${program.env}`;
dotenv.config({path: envFile});
console.log(`ENV_FILE: ${warning(envFile)}`)
console.log(`DOCKER MACHINE: ${warning(currentDockerMachine)}`)
console.log('Start building (webpack)...');

process.env['ENV_FILE'] = envFile;
process.env['ENV'] = program.env;

var webpackConfig = require('../webpack.prod');

webpackConfig.plugins.push(
  new webpack.DefinePlugin({
    'process.env.SENTRY_RELEASE': JSON.stringify(SENTRY_RELEASE),
    'process.env.SENTRY_DSN': JSON.stringify(process.env.SENTRY_DSN_WEB)
  })
);

webpack(webpackConfig, function(error, stats) {
  if (error) return console.error(error);
  if (stats.hasErrors()) return console.log(stats.toString({colors: true}));
  if (program.release) {
    utils.uploadSentrySourceMaps('web', SENTRY_RELEASE);
  }
  console.log('Done!');
});


