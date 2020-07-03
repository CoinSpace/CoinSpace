#!/usr/bin/env node
'use strict';

var program = require('commander');
var fse = require('fs-extra');
var path = require('path');
var util = require('util');
var pkg = require('../package.json');
var utils = require('./utils');
var replace = require('replace-in-file');
var webpack = require('webpack');
var dotenv = require('dotenv');
var mobileBuildPath = 'phonegap/build';
var SENTRY_RELEASE = `${pkg.name}.ios@${pkg.version}`;
var xcode = require('../phonegap/node_modules/xcode');
var plist = require('../phonegap/node_modules/plist');

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

webpack(webpackConfig, async function(error, stats) {
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

  /* eslint-disable max-len */
  utils.cordova('platform add ios@6.1.0');
  utils.cordova('plugin add cordova-plugin-geolocation@4.0.2');
  utils.cordova('plugin add phonegap-plugin-barcodescanner@8.1.0');
  utils.cordova('plugin add cordova-plugin-dialogs@2.0.2');
  utils.cordova('plugin add cordova-plugin-inappbrowser@4.0.0');
  utils.cordova('plugin add cordova-plugin-statusbar@2.4.3');
  utils.cordova('plugin add cordova-plugin-x-socialsharing@5.6.8');
  utils.cordova('plugin add cordova-plugin-touch-id@3.4.0 --variable FACEID_USAGE_DESCRIPTION="Used for easy authentication"');
  utils.cordova('plugin add cordova-plugin-customurlscheme@5.0.1 --variable URL_SCHEME=coinspace');
  utils.cordova('plugin add https://github.com/CoinSpace/cordova-plugin-zendesk#23f993dc73feafbf8eb00496f9a5da0884374a10');
  utils.cordova('plugin add cordova-plugin-cookiemaster@1.0.5');
  utils.cordova('plugin add cordova-plugin-3dtouch-shortcutitems@1.0.2');
  utils.cordova('plugin add cordova-plugin-safariviewcontroller@1.6.0');

  var orientations = {
    'UISupportedInterfaceOrientations': [
      'UIInterfaceOrientationPortrait',
    ],
    'UISupportedInterfaceOrientations~ipad': [
      'UIInterfaceOrientationPortrait',
      'UIInterfaceOrientationLandscapeLeft',
      'UIInterfaceOrientationLandscapeRight',
    ],
  };
  updatePlist(path.join(mobileBuildPath, 'platforms/ios/Coin/Coin-Info.plist'), orientations);

  await addWatchApp();

  if (program.release) {
    utils.uploadSentrySourceMaps('ios', SENTRY_RELEASE);
  }

  utils.shell('open platforms/ios/Coin.xcworkspace', { cwd: mobileBuildPath });
  console.log('Done!');
});

function updatePlist(plistPath, update) {
  var plistContent = plist.parse(fse.readFileSync(plistPath, 'utf-8'));
  const plistData = Object.assign({}, plistContent, update);
  fse.writeFileSync(plistPath, plist.build(plistData, {
    indent: '\t',
    offset: -1,
  }), 'utf-8');
}

async function addWatchApp() {
  utils.shell(`git clone https://github.com/CoinSpace/cs-watchapp-ios.git`, { cwd: mobileBuildPath });
  utils.shell(`cd cs-watchapp-ios && git checkout 5d4d7c202e4c42cf94ddf937f6626daa12de7f7e -q`, { cwd: mobileBuildPath });
  utils.shell(`ln -s ${path.resolve(mobileBuildPath, 'cs-watchapp-ios/WatchApp')} ./platforms/ios/WatchApp`, { cwd: mobileBuildPath });
  utils.shell(`ln -s ${path.resolve(mobileBuildPath, 'cs-watchapp-ios/WatchAppExtension')} ./platforms/ios/WatchAppExtension`, { cwd: mobileBuildPath });

  var projectPath = path.resolve(mobileBuildPath, 'platforms/ios/Coin.xcodeproj/project.pbxproj');
  var project = xcode.project(projectPath);
  await util.promisify(project.parse.bind(project))();

  const WatchApp = addFolderToProject('WatchApp', path.join(mobileBuildPath, 'platforms/ios'), project);
  const WatchAppExtension = addFolderToProject('WatchAppExtension', path.join(mobileBuildPath, 'platforms/ios'), project);

  function addFolderToProject(folderPath, basePath, project, isChild) {
    var folder = path.basename(folderPath);
    var watchAppPaths = fse.readdirSync(path.resolve(basePath, folderPath));
    var files = [];
    var childs = [];
    watchAppPaths.forEach((f) => {
      if (f.startsWith('.')) return;
      var s = fse.statSync(path.resolve(basePath, folderPath, f));
      if (s.isFile() || path.extname(f) === '.xcassets') {
        files.push(path.join(folderPath, f));
      } else {
        childs.push(addFolderToProject(path.join(folderPath, f), basePath, project, true));
      }
    });
    const group = project.addPbxGroup(files, path.basename(folder), '""');
    childs.forEach((child) => {
      files = files.concat(child.files);
      project.addToPbxGroup(child.group.uuid, group.uuid);
    });

    if (!isChild) {
      project.addToPbxGroup(group.uuid, project.findPBXGroupKey({ name: 'CustomTemplate' }));
    }
    return { group, files };
  }

  // add new targets
  var WatchAppTarget = project.addTarget('WatchApp', 'watch2_app', 'WatchApp', 'com.coinspace.wallet.watchapp');
  var WatchAppExtensionTarget = project.addTarget('WatchAppExtension', 'watch2_extension', 'WatchAppExtension', 'com.coinspace.wallet.watchapp.extension');

  // edit XCBuildConfiguration
  const pbxXCBuildConfigurationSection = project.pbxXCBuildConfigurationSection();
  Object.keys(pbxXCBuildConfigurationSection).forEach((key) => {
    const setting = pbxXCBuildConfigurationSection[key].buildSettings;
    if (!setting) return false;
    const name = pbxXCBuildConfigurationSection[key].name;
    if (setting['PRODUCT_NAME'] === '"WatchApp"' || setting['PRODUCT_NAME'] === '"WatchAppExtension"') {
      setting['SDKROOT'] = 'watchos';
      setting['MARKETING_VERSION'] = pkg.version;
      setting['CURRENT_PROJECT_VERSION'] = '1';
      setting['SWIFT_VERSION'] = '4.0';
      setting['TARGETED_DEVICE_FAMILY'] = '4';
      setting['WATCHOS_DEPLOYMENT_TARGET'] = '4.3';
      setting['ENABLE_BITCODE'] = 'YES';
      if (name === 'Release') {
        setting['SWIFT_OPTIMIZATION_LEVEL'] = '"-O"';
        setting['SWIFT_COMPILATION_MODE'] = 'wholemodule';
      } else {
        setting['SWIFT_OPTIMIZATION_LEVEL'] = '"-Onone"';
      }
    }
    if (setting['PRODUCT_NAME'] === '"WatchApp"') {
      setting['CODE_SIGN_ENTITLEMENTS'] = '"WatchApp/CoinSpace WatchApp.entitlements"';
      setting['ASSETCATALOG_COMPILER_APPICON_NAME'] = 'AppIcon';
    } else if (setting['PRODUCT_NAME'] === '"WatchAppExtension"') {
      setting['SWIFT_OBJC_BRIDGING_HEADER'] = '""';
      setting['CODE_SIGN_ENTITLEMENTS'] = '"WatchAppExtension/CoinSpace WatchApp Extension.entitlements"';
      setting['ASSETCATALOG_COMPILER_COMPLICATION_NAME'] = 'Complication';
    }
  });

  project.addBuildPhase(
    WatchApp.files.filter((f) => /(\.xcassets|\.storyboard)$/.test(f)),
    'PBXResourcesBuildPhase',
    'Resources',
    WatchAppTarget.uuid
  );

  project.addBuildPhase(WatchAppExtension.files.filter((f) => /\.swift$/.test(f)), 'PBXSourcesBuildPhase', 'Sources', WatchAppExtensionTarget.uuid);

  project.addBuildPhase(
    WatchAppExtension.files.filter((f) => /(\.xcassets)$/.test(f)),
    'PBXResourcesBuildPhase',
    'Resources',
    WatchAppExtensionTarget.uuid
  );

  fse.writeFileSync(projectPath, project.writeSync());

  // add pods
  var watchAppPodfile = fse.readFileSync(path.resolve(mobileBuildPath, 'cs-watchapp-ios/WatchAppExtension/Podfile'));
  fse.appendFileSync(path.resolve(mobileBuildPath, 'platforms/ios/Podfile'), watchAppPodfile);
  utils.shell(`pod install`, { cwd: path.join(mobileBuildPath, 'platforms/ios') });
}
