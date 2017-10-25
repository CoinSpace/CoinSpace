#!/usr/bin/env node

var program = require('commander');
var fse = require('fs-extra');
var path = require('path');
var utils = require('./utils');
var webpack = require('webpack');
var dotenv = require('dotenv');
var mobileBuildPath = 'phonegap/build';

program
  .name('build-android.js')
  .option('-e, --env <env>', 'environment', 'prod')
  .option('--run', 'run app')
  .option('--release', 'release mode')
  .parse(process.argv);

if (program.run) {
  return utils.cordova('run android');
}

console.log('Start building (webpack)...');

var envFile = `.env.${program.env}`;
dotenv.config({path: envFile});
process.env['ENV_FILE'] = envFile;
process.env['BUILD_TYPE'] = 'phonegap';
var webpackConfig = require('../webpack.prod');

webpackConfig.plugins.push(
  new webpack.DefinePlugin({
    'process.env.BUILD_TYPE': JSON.stringify('phonegap'),
    'process.env.BUILD_PLATFORM': JSON.stringify('android')
  })
)

webpack(webpackConfig, function(error, stats) {
  if (error) return console.error(error);
  if (stats.hasErrors()) return console.log(stats.toString({colors: true}));

  fse.removeSync(mobileBuildPath);
  fse.copySync('phonegap/config.xml.template', path.resolve(mobileBuildPath, 'config.xml'));
  fse.copySync('build', path.resolve(mobileBuildPath, 'www'));

  utils.cordova('platform add android@6.1.0');
  utils.cordova('plugin add cordova-plugin-geolocation@2.4.3');
  utils.cordova('plugin add cordova-plugin-whitelist@1.3.2');
  utils.cordova('plugin add cordova-plugin-inappbrowser@1.7.1');
  utils.cordova('plugin add cordova-plugin-splashscreen@4.0.3');
  utils.cordova('plugin add phonegap-plugin-barcodescanner@6.0.8');
  utils.cordova('plugin add cordova-plugin-dialogs@1.3.3');
  utils.cordova('plugin add cordova-plugin-x-socialsharing@5.2.0');
  utils.cordova('plugin add cordova-facebook-audnet-sdk@4.23.0');
  utils.cordova('plugin add cordova-plugin-facebookads@4.23.2');
  utils.cordova('plugin add cordova-plugin-android-fingerprint-auth@1.4.0');
  utils.cordova(`plugin add cc.fovea.cordova.purchase@7.0.2 --variable BILLING_KEY="${process.env['ANDROID_BILLING_KEY']}"`);

  if (program.release) {
    utils.cordova('build android --release');
    utils.shell(
      `jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ../release.keystore \
      -storepass coinspace platforms/android/build/outputs/apk/*-release-unsigned.apk coinspace`,
      {cwd: mobileBuildPath}
    );
    utils.shell(
      `zipalign -f -v 4 platforms/android/build/outputs/apk/*-release-unsigned.apk \
      ../deploy/coinspace-release.apk`,
      {cwd: mobileBuildPath}
    );
  } else {
    utils.cordova('build android');
  }

  console.log('Done!');
});
