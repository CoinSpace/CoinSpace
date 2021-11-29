'use strict';

const fse = require('fs-extra');
const path = require('path');
const ejs = require('ejs');
const util = require('util');
const utils = require('../cli/utils');
const pkg = require('../package.json');
const xcode = require('xcode');
const plist = require('plist');
const { Storage } = require('@google-cloud/storage');
const storage = new Storage();
const buildPath = 'build';
const cordova = utils.cordova(buildPath);
const languages = require('../app/lib/i18n/list.json').map((item) => {
  return item.replace('-', '_').replace(/_[a-z]+/, s => s.toUpperCase());
});

const BUILD_NUMBER = process.env.GITHUB_RUN_NUMBER || '1';
const BRANCH = process.env.GITHUB_REF && process.env.GITHUB_REF.replace('refs/heads/', '');

async function run() {
  const config = ejs.render(fse.readFileSync('config.xml.template', 'utf-8'), {
    widget: {
      id: 'com.coinspace.wallet',
      version: pkg.version,
      iosCFBundleVersion: BUILD_NUMBER,
    },
  });
  fse.writeFileSync(path.resolve(buildPath, 'config.xml'), config);

  /* eslint-disable max-len */
  /* eslint-disable quote-props */
  cordova('platform add ios@6.1.0');
  cordova('plugin add cordova-plugin-geolocation@4.0.2');
  cordova('plugin add phonegap-plugin-barcodescanner@8.1.0');
  cordova('plugin add cordova-plugin-dialogs@2.0.2');
  cordova('plugin add cordova-plugin-inappbrowser@4.0.0');
  cordova('plugin add cordova-plugin-statusbar@2.4.3');
  cordova('plugin add cordova-plugin-x-socialsharing@5.6.8 --variable PHOTO_LIBRARY_USAGE_DESCRIPTION="This app uses your photo library to upload photos." --variable PHOTO_LIBRARY_ADD_USAGE_DESCRIPTION="This app saves images to your photo library."');
  cordova('plugin add cordova-plugin-touch-id@3.4.0 --variable FACEID_USAGE_DESCRIPTION="Used for easy authentication."');
  cordova('plugin add cordova-plugin-customurlscheme@5.0.1 --variable URL_SCHEME=coinspace');
  cordova('plugin add https://github.com/CoinSpace/cordova-plugin-zendesk#b9e98ce96df3ad21290186b959f861e04446ebdc');
  cordova('plugin add cordova-plugin-3dtouch-shortcutitems@1.0.2');
  cordova('plugin add cordova-plugin-safariviewcontroller@1.6.0');
  cordova('plugin add cordova-plugin-inapp-review@1.1.0');

  const update = {
    'UISupportedInterfaceOrientations': [
      'UIInterfaceOrientationPortrait',
    ],
    'UISupportedInterfaceOrientations~ipad': [
      'UIInterfaceOrientationPortrait',
      'UIInterfaceOrientationLandscapeLeft',
      'UIInterfaceOrientationLandscapeRight',
    ],
    'CFBundleURLTypes': [
      {
        'CFBundleURLSchemes': [
          'coinspace',
          'bitcoin',
          'bitcoincash',
          'bitcoinsv',
          'ethereum',
          'litecoin',
          'ripple',
          'stellar',
          'eos',
          'dogecoin',
          'dash',
          'monero',
        ],
      },
    ],
    'CFBundleLocalizations': languages,
  };
  updatePlist(path.join(buildPath, 'platforms/ios/Coin/Coin-Info.plist'), update);

  await addWatchApp();

  if (process.env.CI) {
    utils.shell(
      'set -o pipefail && xcodebuild -workspace Coin.xcworkspace -scheme Coin \
      -configuration AppStoreDistribution archive \
      -archivePath Coin.xcarchive | xcpretty',
      { cwd: path.join(buildPath, 'platforms/ios') }
    );
    utils.shell(
      'set -o pipefail && xcodebuild -exportArchive -archivePath Coin.xcarchive \
      -exportOptionsPlist ../../../iosExportOptions.plist \
      -exportPath ../../../deploy | xcpretty',
      { cwd: path.join(buildPath, 'platforms/ios') }
    );
    const destination = `${pkg.version}-${BRANCH || 'local'}/${pkg.name}-${pkg.version}.ipa`;
    await storage.bucket(process.env.GOOGLE_CLOUD_BUCKET).upload('deploy/Coin.ipa', { destination });
  } else {
    utils.shell('open platforms/ios/Coin.xcworkspace', { cwd: buildPath });
  }
}

function updatePlist(plistPath, update) {
  const plistContent = plist.parse(fse.readFileSync(plistPath, 'utf-8'));
  const plistData = Object.assign({}, plistContent, update);
  fse.writeFileSync(plistPath, plist.build(plistData, {
    indent: '\t',
    offset: -1,
  }), 'utf-8');
}

async function addWatchApp() {
  utils.shell('git clone https://github.com/CoinSpace/cs-watchapp-ios.git', { cwd: buildPath });
  utils.shell('cd cs-watchapp-ios && git checkout caf5a73e4fd6ec6beb414dffe6de647613dbb7ea -q', { cwd: buildPath });
  utils.shell(`ln -s ${path.resolve(buildPath, 'cs-watchapp-ios/WatchApp')} ./platforms/ios/WatchApp`, { cwd: buildPath });
  utils.shell(`ln -s ${path.resolve(buildPath, 'cs-watchapp-ios/WatchAppExtension')} ./platforms/ios/WatchAppExtension`, { cwd: buildPath });

  const projectPath = path.resolve(buildPath, 'platforms/ios/Coin.xcodeproj/project.pbxproj');
  const project = xcode.project(projectPath);
  await util.promisify(project.parse.bind(project))();

  const WatchApp = addFolderToProject('WatchApp', path.join(buildPath, 'platforms/ios'), project);
  const WatchAppExtension = addFolderToProject('WatchAppExtension', path.join(buildPath, 'platforms/ios'), project);

  function addFolderToProject(folderPath, basePath, project, isChild) {
    const folder = path.basename(folderPath);
    const watchAppPaths = fse.readdirSync(path.resolve(basePath, folderPath));
    let files = [];
    const childs = [];
    watchAppPaths.forEach((f) => {
      if (f.startsWith('.')) return;
      const s = fse.statSync(path.resolve(basePath, folderPath, f));
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
  const WatchAppTarget = project.addTarget('WatchApp', 'watch2_app', 'WatchApp', 'com.coinspace.wallet.watchapp');
  const WatchAppExtensionTarget = project.addTarget('WatchAppExtension', 'watch2_extension', 'WatchAppExtension', 'com.coinspace.wallet.watchapp.extension');

  // edit XCBuildConfiguration
  const pbxXCBuildConfigurationSection = project.pbxXCBuildConfigurationSection();
  Object.keys(pbxXCBuildConfigurationSection).forEach((key) => {
    const setting = pbxXCBuildConfigurationSection[key].buildSettings;
    if (!setting) return false;
    if (!setting['PRODUCT_BUNDLE_IDENTIFIER']) return false;

    setting['CODE_SIGN_STYLE'] = 'Manual';
    setting['DEVELOPMENT_TEAM'] = '3M4KWD4BUU';

    const { name } = pbxXCBuildConfigurationSection[key];
    if (setting['PRODUCT_NAME'] === '"WatchApp"' || setting['PRODUCT_NAME'] === '"WatchAppExtension"') {
      setting['SDKROOT'] = 'watchos';
      setting['MARKETING_VERSION'] = pkg.version;
      setting['CURRENT_PROJECT_VERSION'] = BUILD_NUMBER;
      setting['SWIFT_VERSION'] = '4.0';
      setting['TARGETED_DEVICE_FAMILY'] = '4';
      setting['WATCHOS_DEPLOYMENT_TARGET'] = '4.3';
      setting['ENABLE_BITCODE'] = 'YES';
      if (name === 'Release') {
        setting['SWIFT_OPTIMIZATION_LEVEL'] = '"-O"';
        setting['SWIFT_COMPILATION_MODE'] = 'wholemodule';
        setting['CODE_SIGN_IDENTITY'] = '"iPhone Distribution"';
      } else {
        setting['SWIFT_OPTIMIZATION_LEVEL'] = '"-Onone"';
      }
    }

    if (setting['PRODUCT_BUNDLE_IDENTIFIER'] === 'com.coinspace.wallet') {
      if (name === 'Release') {
        setting['PROVISIONING_PROFILE_SPECIFIER'] = '"com.coinspace.wallet (production)"';
      } else {
        setting['PROVISIONING_PROFILE_SPECIFIER'] = 'com.coinspace.wallet';
      }
    } else if (setting['PRODUCT_NAME'] === '"WatchApp"') {
      setting['CODE_SIGN_ENTITLEMENTS'] = '"WatchApp/CoinSpace WatchApp.entitlements"';
      setting['ASSETCATALOG_COMPILER_APPICON_NAME'] = 'AppIcon';
      if (name === 'Release') {
        setting['PROVISIONING_PROFILE_SPECIFIER'] = '"com.coinspace.wallet.watchapp (production)"';
      } else {
        setting['PROVISIONING_PROFILE_SPECIFIER'] = 'com.coinspace.wallet.watchapp';
      }
    } else if (setting['PRODUCT_NAME'] === '"WatchAppExtension"') {
      setting['SWIFT_OBJC_BRIDGING_HEADER'] = '""';
      setting['CODE_SIGN_ENTITLEMENTS'] = '"WatchAppExtension/CoinSpace WatchApp Extension.entitlements"';
      setting['ASSETCATALOG_COMPILER_COMPLICATION_NAME'] = 'Complication';
      if (name === 'Release') {
        setting['PROVISIONING_PROFILE_SPECIFIER'] = '"com.coinspace.wallet.watchapp.extension (prod)"';
      } else {
        setting['PROVISIONING_PROFILE_SPECIFIER'] = 'com.coinspace.wallet.watchapp.extension';
      }
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
  const watchAppPodfile = fse.readFileSync(path.resolve(buildPath, 'cs-watchapp-ios/WatchAppExtension/Podfile'));
  fse.appendFileSync(path.resolve(buildPath, 'platforms/ios/Podfile'), watchAppPodfile);
  utils.shell('pod install', { cwd: path.join(buildPath, 'platforms/ios') });
  utils.shell('cat Podfile.lock', { cwd: path.join(buildPath, 'platforms/ios') });
}

process.on('unhandledRejection', (err) => {
  throw err;
});

run();
