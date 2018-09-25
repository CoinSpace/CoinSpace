#!/usr/bin/env node

var program = require('commander');
var fse = require('fs-extra');
var path = require('path');
var utils = require('./utils');
var replace = require('replace-in-file');
var webpack = require('webpack');
var mobileBuildPath = 'phonegap/build';

program
  .name('build-ios.js')
  .option('-e, --env <env>', 'environment', 'prod')
  .option('--release', 'release mode')
  .parse(process.argv);

console.log('Start building (webpack)...');

var envFile = `.env.${program.env}`;
process.env['ENV_FILE'] = envFile;
process.env['BUILD_TYPE'] = 'phonegap';
var webpackConfig = require('../webpack.prod');

webpackConfig.plugins.push(
  new webpack.DefinePlugin({
    'process.env.BUILD_TYPE': JSON.stringify('phonegap'),
    'process.env.BUILD_PLATFORM': JSON.stringify('ios')
  })
)

webpack(webpackConfig, function(error, stats) {
  if (error) return console.error(error);
  if (stats.hasErrors()) return console.log(stats.toString({colors: true}));

  fse.removeSync(mobileBuildPath);
  fse.copySync('phonegap/config.xml.template', path.resolve(mobileBuildPath, 'config.xml'));
  replace.sync({
    files: path.resolve(mobileBuildPath, 'config.xml'),
    from: 'id="com.coinspace.app"',
    to: 'id="com.coinspace.wallet"'
  });
  fse.copySync('build', path.resolve(mobileBuildPath, 'www'));

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
  utils.cordova('plugin add cordova-facebook-audnet-sdk@4.23.0');
  utils.cordova('plugin add cordova-plugin-facebookads@4.23.2');
  utils.cordova('plugin add cc.fovea.cordova.purchase@7.2.0');

  if (program.release) {
    utils.cordova('build ios --emulator --buildConfig=../build.json --release');
  } else {
    utils.cordova('build ios --emulator --buildConfig=../build.json');
  }

  console.log('Done!');
});
