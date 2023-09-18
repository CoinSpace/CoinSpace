/* eslint-disable max-len */
/* eslint-disable quote-props */

import { Storage } from '@google-cloud/storage';
import ejs from 'ejs';
import fs from 'fs';
import path from 'path';
import plist from 'plist';
import util from 'util';
import xcode from 'xcode';

import { languages } from '../web/src/lib/i18n/i18n.js';
import { cordova as Cordova, shell } from './utils.js';

const buildPath = 'build';
const cordova = Cordova(buildPath);

const storage = new Storage();
const BUILD_NUMBER = process.env.GITHUB_RUN_NUMBER || '1';
const BRANCH = process.env.GITHUB_REF && process.env.GITHUB_REF.replace('refs/heads/', '');
const VERSION = process.env.npm_package_version;
const NAME = process.env.npm_package_name;
const CFBundleName = 'Coin Wallet';

async function run() {
  const files = fs.readdirSync(buildPath);
  for (const file of files) {
    if (file === 'www') continue;
    fs.rmSync(path.resolve(buildPath, file), { force: true, recursive: true });
  }

  const config = ejs.render(fs.readFileSync('config.xml.template', 'utf-8'), {
    widget: {
      id: 'com.coinspace.wallet',
      name: 'Coin',
      version: VERSION,
      iosCFBundleVersion: BUILD_NUMBER,
    },
  });
  fs.writeFileSync(path.resolve(buildPath, 'config.xml'), config);
  cordova('platform add ios@7.0.1 --save');

  cordova('plugin add cordova-plugin-fingerprint-aio@5.0.1 --save --variable FACEID_USAGE_DESCRIPTION="Used for easy authentication."');
  cordova('plugin add cordova-plugin-geolocation@4.1.0 --save');
  cordova('plugin add phonegap-plugin-barcodescanner@8.1.0 --save');
  cordova('plugin add cordova-plugin-dialogs@2.0.2 --save');
  cordova('plugin add cordova-plugin-inappbrowser@5.0.0 --save');
  cordova('plugin add cordova-plugin-statusbar@3.0.0 --save');
  cordova('plugin add cordova-plugin-x-socialsharing@6.0.4 --save --variable PHOTO_LIBRARY_USAGE_DESCRIPTION="This app uses your photo library to upload photos." --variable PHOTO_LIBRARY_ADD_USAGE_DESCRIPTION="This app saves images to your photo library."');
  cordova('plugin add cordova-plugin-customurlscheme@5.0.2 --save --variable URL_SCHEME=coinspace');
  cordova('plugin add https://github.com/CoinSpace/cordova-plugin-zendesk#4bf28de7fcd6759450f5fd56f2ec28677bc882da --save');
  cordova('plugin add cordova-plugin-3dtouch@1.3.8 --save');
  cordova('plugin add cordova-plugin-safariviewcontroller@2.0.0 --save');
  cordova('plugin add cordova-plugin-app-review@3.1.0 --save');
  cordova('plugin add cordova-plugin-taptic-engine@2.2.0 --save');

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
          'cardano',
        ],
      },
    ],
    CFBundleLocalizations: languages.map((item) => item.value),
    CFBundleName,
    'CFBundleDisplayName': CFBundleName,
  };
  updatePlist(path.join(buildPath, 'platforms/ios/Coin/Coin-Info.plist'), update);

  await setProvisionProfile();
  await addWatchApp();

  if (process.env.CI) {
    shell(
      'set -o pipefail && xcodebuild -workspace Coin.xcworkspace -scheme Coin \
      -configuration AppStoreDistribution archive \
      -archivePath Coin.xcarchive | xcpretty',
      { cwd: path.join(buildPath, 'platforms/ios') }
    );
    shell(
      'set -o pipefail && xcodebuild -exportArchive -archivePath Coin.xcarchive \
      -exportOptionsPlist ../../../iosExportOptions.plist \
      -exportPath ../../../deploy | xcpretty',
      { cwd: path.join(buildPath, 'platforms/ios') }
    );
    const destination = `${VERSION}-${BRANCH || 'local'}/${NAME}-${VERSION}.ipa`;
    await storage.bucket(process.env.GOOGLE_CLOUD_BUCKET).upload(`deploy/${CFBundleName}.ipa`, { destination });
  } else {
    shell('open platforms/ios/Coin.xcworkspace', { cwd: buildPath });
  }
}

function updatePlist(plistPath, update) {
  const plistContent = plist.parse(fs.readFileSync(plistPath, 'utf-8'));
  const plistData = Object.assign({}, plistContent, update);
  fs.writeFileSync(plistPath, plist.build(plistData, {
    indent: '\t',
    offset: -1,
  }), 'utf-8');
}

async function setProvisionProfile() {
  const project = await getXcodeProject();
  const pbxXCBuildConfigurationSection = project.pbxXCBuildConfigurationSection();
  Object.keys(pbxXCBuildConfigurationSection).forEach((key) => {
    const setting = pbxXCBuildConfigurationSection[key].buildSettings;
    if (!setting) return;
    if (!setting['PRODUCT_BUNDLE_IDENTIFIER']) return;
    setting['CODE_SIGN_STYLE'] = 'Manual';
    setting['DEVELOPMENT_TEAM'] = '3M4KWD4BUU';
    const { name } = pbxXCBuildConfigurationSection[key];
    if (setting['PRODUCT_BUNDLE_IDENTIFIER'] === 'com.coinspace.wallet') {
      if (name === 'Release') {
        setting['PROVISIONING_PROFILE_SPECIFIER'] = '"com.coinspace.wallet (production)"';
      } else {
        setting['PROVISIONING_PROFILE_SPECIFIER'] = 'com.coinspace.wallet';
      }
    }
  });
  fs.writeFileSync(project.filepath, project.writeSync());
}

async function addWatchApp() {
  shell('git clone https://github.com/CoinSpace/cs-watchapp-ios.git', { cwd: buildPath });
  shell('cd cs-watchapp-ios && git checkout a749e490e8ba615056240f831d8c8d1c48633e83 -q', { cwd: buildPath });
  shell(`ln -s ${path.resolve(buildPath, 'cs-watchapp-ios/WatchApp')} ./platforms/ios/WatchApp`, { cwd: buildPath });
  shell(`ln -s ${path.resolve(buildPath, 'cs-watchapp-ios/WatchAppExtension')} ./platforms/ios/WatchAppExtension`, { cwd: buildPath });

  const project = await getXcodeProject();

  const WatchApp = addFolderToProject('WatchApp', path.join(buildPath, 'platforms/ios'), project);
  const WatchAppExtension = addFolderToProject('WatchAppExtension', path.join(buildPath, 'platforms/ios'), project);

  function addFolderToProject(folderPath, basePath, project, isChild) {
    const folder = path.basename(folderPath);
    const watchAppPaths = fs.readdirSync(path.resolve(basePath, folderPath));
    let files = [];
    const childs = [];
    watchAppPaths.forEach((f) => {
      if (f.startsWith('.')) return;
      const s = fs.statSync(path.resolve(basePath, folderPath, f));
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
    if (!setting) return;
    if (!setting['PRODUCT_BUNDLE_IDENTIFIER']) return;
    if (!['"WatchApp"', '"WatchAppExtension"'].includes(setting['PRODUCT_NAME'])) return;

    const { name } = pbxXCBuildConfigurationSection[key];

    setting['CODE_SIGN_STYLE'] = 'Manual';
    setting['DEVELOPMENT_TEAM'] = '3M4KWD4BUU';
    setting['SDKROOT'] = 'watchos';
    setting['MARKETING_VERSION'] = VERSION;
    setting['CURRENT_PROJECT_VERSION'] = BUILD_NUMBER;
    setting['SWIFT_VERSION'] = '4.0';
    setting['TARGETED_DEVICE_FAMILY'] = '4';
    setting['WATCHOS_DEPLOYMENT_TARGET'] = '4.3';
    setting['ENABLE_BITCODE'] = 'NO';

    if (name === 'Release') {
      setting['SWIFT_OPTIMIZATION_LEVEL'] = '"-O"';
      setting['SWIFT_COMPILATION_MODE'] = 'wholemodule';
      setting['CODE_SIGN_IDENTITY'] = '"iPhone Distribution"';
    } else {
      setting['SWIFT_OPTIMIZATION_LEVEL'] = '"-Onone"';
    }

    if (setting['PRODUCT_NAME'] === '"WatchApp"') {
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

  fs.writeFileSync(project.filepath, project.writeSync());

  // add pods
  const watchAppPodfile = fs.readFileSync(path.resolve(buildPath, 'cs-watchapp-ios/WatchAppExtension/Podfile'));
  fs.appendFileSync(path.resolve(buildPath, 'platforms/ios/Podfile'), watchAppPodfile);
  shell('pod install', { cwd: path.join(buildPath, 'platforms/ios') });
  shell('cat Podfile.lock', { cwd: path.join(buildPath, 'platforms/ios') });

  // fix xcconfig
  fs.writeFileSync(path.join(buildPath, 'platforms/ios/pods-debug.xcconfig'), '#include "Pods/Target Support Files/Pods-Coin/Pods-Coin.debug.xcconfig"');
  fs.writeFileSync(path.join(buildPath, 'platforms/ios/pods-release.xcconfig'), '#include "Pods/Target Support Files/Pods-Coin/Pods-Coin.release.xcconfig"');
}

async function getXcodeProject() {
  const projectPath = path.resolve(buildPath, 'platforms/ios/Coin.xcodeproj/project.pbxproj');
  const project = xcode.project(projectPath);
  await util.promisify(project.parse.bind(project))();
  return project;
}

process.on('unhandledRejection', (err) => {
  throw err;
});

run();
