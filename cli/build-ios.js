#!/usr/bin/env node
'use strict';

var program = require('commander');
var fse = require('fs-extra');
var path = require('path');
var pkg = require('../package.json');
var utils = require('./utils');
var replace = require('replace-in-file');
var webpack = require('webpack');
var dotenv = require('dotenv');
var mobileBuildPath = 'phonegap/build';
var SENTRY_RELEASE = `${pkg.name}.ios@${pkg.version}`;

program
  .name('build-ios.js')
  .option('-e, --env <env>', 'environment', 'prod')
  .option('--release', 'release mode')
  .parse(process.argv);

console.log('Start building (webpack)...');

var envFile = `.env.${program.env}`;
dotenv.config({ path: envFile });
process.env['ENV_FILE'] = envFile;
process.env['ENV'] = program.env;
process.env['BUILD_TYPE'] = 'phonegap';
var webpackConfig = require('../webpack.prod');

webpackConfig.plugins.push(
  new webpack.DefinePlugin({
    'process.env.BUILD_TYPE': JSON.stringify('phonegap'),
    'process.env.BUILD_PLATFORM': JSON.stringify('ios'),
    'process.env.SENTRY_RELEASE': JSON.stringify(SENTRY_RELEASE),
    'process.env.SENTRY_DSN': JSON.stringify(process.env.SENTRY_DSN_IOS),
  })
);

webpack(webpackConfig, function(error, stats) {
  if (error) return console.error(error);
  if (stats.hasErrors()) return console.log(stats.toString({ colors: true }));

  fse.removeSync(mobileBuildPath);
  fse.copySync('phonegap/config.xml.template', path.resolve(mobileBuildPath, 'config.xml'));
  replace.sync({
    files: path.resolve(mobileBuildPath, 'config.xml'),
    from: 'id="com.coinspace.app"',
    to: 'id="com.coinspace.wallet"',
  });
  fse.copySync('build', path.resolve(mobileBuildPath, 'www'), { filter: utils.filterMapFiles });

  utils.cordova('platform add ios@4.5.3');
  utils.cordova('plugin add cordova-plugin-geolocation@2.4.3');
  utils.cordova('plugin add cordova-plugin-whitelist@1.3.2');
  utils.cordova('plugin add cordova-plugin-splashscreen@4.0.3');
  utils.cordova('plugin add phonegap-plugin-barcodescanner@6.0.8');
  utils.cordova('plugin add cordova-plugin-dialogs@1.3.3');
  utils.cordova('plugin add cordova-plugin-inappbrowser@1.7.1');
  utils.cordova('plugin add cordova-plugin-statusbar@2.3.0');
  utils.cordova('plugin add cordova-plugin-x-socialsharing@5.2.0');
  utils.cordova('plugin add cordova-plugin-touch-id@3.2.0');
  utils.cordova('plugin add cordova-plugin-customurlscheme@4.3.0 --variable URL_SCHEME=coinspace');
  // eslint-disable-next-line max-len
  utils.cordova('plugin add https://github.com/CoinSpace/cordova-plugin-zendesk#45badb1e6f909bb80592779f7cb6baf6875df3ab');
  utils.cordova('plugin add cordova-plugin-cookiemaster@1.0.5');
  utils.cordova('plugin add cordova-plugin-3dtouch-shortcutitems@1.0.2');

  if (program.release) {
    utils.uploadSentrySourceMaps('ios', SENTRY_RELEASE);
    utils.cordova('build ios --emulator --buildConfig=../build.json --release');
  } else {
    utils.cordova('build ios --emulator --buildConfig=../build.json');
  }

  console.log('Done!');
});
