#!/usr/bin/env node
'use strict';

var program = require('commander');
var fse = require('fs-extra');
var path = require('path');
var pkg = require('../package.json');
var utils = require('./utils');
var webpack = require('webpack');
var replace = require('replace-in-file');
var dotenv = require('dotenv');
var mobileBuildPath = 'phonegap/build';
var SENTRY_RELEASE = `${pkg.name}.android@${pkg.version}`;

program
  .name('build-android.js')
  .option('-e, --env <env>', 'environment', 'prod')
  .option('--run', 'run app')
  .option('--release', 'release mode')
  .parse(process.argv);

if (program.run) {
  return utils.cordova('run android --noprepare');
}

console.log('Start building (webpack)...');

var envFile = `.env.${program.env}`;
dotenv.config({path: envFile});
process.env['ENV_FILE'] = envFile;
process.env['ENV'] = program.env;
process.env['BUILD_TYPE'] = 'phonegap';
var webpackConfig = require('../webpack.prod');

webpackConfig.plugins.push(
  new webpack.DefinePlugin({
    'process.env.BUILD_TYPE': JSON.stringify('phonegap'),
    'process.env.BUILD_PLATFORM': JSON.stringify('android'),
    'process.env.SENTRY_RELEASE': JSON.stringify(SENTRY_RELEASE),
    'process.env.SENTRY_DSN': JSON.stringify(process.env.SENTRY_DSN_ANDROID),
  })
);

webpack(webpackConfig, function(error, stats) {
  if (error) return console.error(error);
  if (stats.hasErrors()) return console.log(stats.toString({colors: true}));

  fse.removeSync(mobileBuildPath);
  fse.copySync('phonegap/config.xml.template', path.resolve(mobileBuildPath, 'config.xml'));
  fse.copySync('build', path.resolve(mobileBuildPath, 'www'), {filter: utils.filterMapFiles});

  utils.cordova('platform add android@6.4.0');

  utils.cordova('plugin add cordova-custom-config@5.0.2');
  utils.cordova('plugin add cordova-plugin-geolocation@2.4.3');
  utils.cordova('plugin add cordova-plugin-whitelist@1.3.2');
  utils.cordova('plugin add cordova-plugin-inappbrowser@1.7.1');
  utils.cordova('plugin add cordova-plugin-splashscreen@4.0.3');
  utils.cordova('plugin add phonegap-plugin-barcodescanner@6.0.8');
  utils.cordova('plugin add cordova-plugin-dialogs@1.3.3');
  utils.cordova('plugin add cordova-plugin-x-socialsharing@5.2.0');
  utils.cordova('plugin add cordova-plugin-android-fingerprint-auth@1.4.0');
  utils.cordova('plugin add cordova-plugin-customurlscheme@4.3.0 --variable URL_SCHEME=coinspace');
  // eslint-disable-next-line max-len
  utils.cordova('plugin add https://github.com/CoinSpace/cordova-plugin-zendesk#269d8d9b3f18eccffbf20071a43730c7ac3fd5b0');
  utils.cordova('plugin add cordova-plugin-cookiemaster@1.0.5');

  replace.sync({
    files: path.resolve(mobileBuildPath, 'platforms/android/project.properties'),
    from: 'android-26',
    to: 'android-28',
  });

  if (program.release) {
    utils.uploadSentrySourceMaps('android', SENTRY_RELEASE);
    utils.cordova('build android --release');
    utils.shell(
      `jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ../release.keystore \
      -storepass coinspace platforms/android/build/outputs/apk/release/android-release-unsigned.apk coinspace`,
      {cwd: mobileBuildPath}
    );
    utils.shell(
      `zipalign -f -v 4 platforms/android/build/outputs/apk/release/android-release-unsigned.apk \
      ../deploy/coinspace-release.apk`,
      {cwd: mobileBuildPath}
    );
  } else {
    utils.cordova('build android');
  }

  console.log('Done!');
});
