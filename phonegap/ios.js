/* eslint-disable max-len */
/* eslint-disable quote-props */

import { Storage } from '@google-cloud/storage';
import ejs from 'ejs';
import fs from 'fs';
import path from 'path';
import plist from 'plist';
import util from 'util';
import xcode from 'xcode';

import { languages } from '../web/src/lib/i18n/languages.js';
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

  cordova('plugin add cordova-plugin-fingerprint-aio@6.0.1 --save --variable FACEID_USAGE_DESCRIPTION="Used for easy authentication."');
  cordova('plugin add cordova-plugin-geolocation@5.0.0 --save');
  cordova('plugin add cordova-plugin-qrscanner-11@3.0.5 --save');
  cordova('plugin add cordova-plugin-dialogs@2.0.2 --save');
  cordova('plugin add cordova-plugin-inappbrowser@5.0.0 --save');
  cordova('plugin add cordova-plugin-statusbar@3.0.0 --save');
  cordova('plugin add cordova-plugin-x-socialsharing@6.0.4 --save --variable PHOTO_LIBRARY_USAGE_DESCRIPTION="This app uses your photo library to upload photos." --variable PHOTO_LIBRARY_ADD_USAGE_DESCRIPTION="This app saves images to your photo library."');
  cordova('plugin add cordova-plugin-customurlscheme@5.0.2 --save --variable URL_SCHEME=coinspace');
  cordova('plugin add https://github.com/CoinSpace/cordova-plugin-zendesk#d586e04e93aaadbd6c89f77a89961599a2275577 --save');
  cordova('plugin add cordova-plugin-3dtouch@1.3.8 --save');
  cordova('plugin add cordova-plugin-safariviewcontroller@2.0.0 --save');
  cordova('plugin add cordova-plugin-app-review@3.1.0 --save');
  cordova('plugin add cordova-plugin-taptic-engine@2.2.0 --save');
  cordova('plugin add cordova-clipboard@1.3.0 --save');
  cordova('plugin add cordova-ios-plugin-userdefaults@1.0.0 --save');
  cordova('plugin add https://github.com/CoinSpace/corodva-plugin-widget-center#bd96a918400a050813c3395f87c73243837e7920 --save');

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
          'bitcoincash',
          'bitcoin',
          'cardano',
          'dash',
          'dogecoin',
          'eos',
          'ethereum',
          'litecoin',
          'monero',
          'solana',
          'stellar',
          'ripple',
        ],
      },
    ],
    CFBundleLocalizations: languages.map((item) => item.value),
    CFBundleName,
    'CFBundleDisplayName': CFBundleName,
    NSCameraUsageDescription: 'This app uses the camera to scan QR codes and take pictures.',
  };
  updatePlist(path.join(buildPath, 'platforms/ios/Coin/Coin-Info.plist'), update);

  await setProvisionProfile();
  await addWatchApp('https://github.com/CoinSpace/cs-watchapp-ios.git#c3c626819e1e307739e6d335dafc9a16bdc43af5');
  await addWidget('https://github.com/CoinSpace/cs-widget-ios.git#b57c3bdf6f6b2be9cdabe8b51627ea21e36b7fb4');
  await addPods();

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
      setting['SUPPORTS_MACCATALYST'] = 'NO';
      setting['SUPPORTS_MAC_DESIGNED_FOR_IPHONE_IPAD'] = 'NO';
      if (name === 'Release') {
        setting['PROVISIONING_PROFILE_SPECIFIER'] = '"com.coinspace.wallet (production)"';
      } else {
        setting['PROVISIONING_PROFILE_SPECIFIER'] = 'com.coinspace.wallet';
      }
    }
  });
  fs.writeFileSync(project.filepath, project.writeSync());
}

async function addWatchApp(repo) {
  cloneRepo(repo);

  const project = await getXcodeProject();

  const WatchApp = addFolderToProject('WatchApp', path.join(buildPath, 'platforms/ios/cs-watchapp-ios'), project);
  const WatchAppExtension = addFolderToProject('WatchAppExtension', path.join(buildPath, 'platforms/ios/cs-watchapp-ios'), project);

  // add new targets
  const WatchAppTarget = project.addTarget('WatchApp', 'watch2_app', 'WatchApp', 'com.coinspace.wallet.watchapp');
  const WatchAppExtensionTarget = project.addTarget('WatchAppExtension', 'watch2_extension', 'WatchAppExtension', 'com.coinspace.wallet.watchapp.extension');

  // edit XCBuildConfiguration
  const pbxXCBuildConfigurationSection = project.pbxXCBuildConfigurationSection();
  Object.keys(pbxXCBuildConfigurationSection).forEach((key) => {
    const setting = pbxXCBuildConfigurationSection[key].buildSettings;
    if (!setting) return;
    delete setting['MERGED_BINARY_TYPE'];
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
    setting['WATCHOS_DEPLOYMENT_TARGET'] = '5.0';
    setting['ENABLE_BITCODE'] = 'NO';
    setting['ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES'] = 'NO';

    if (name === 'Release') {
      setting['SWIFT_OPTIMIZATION_LEVEL'] = '"-O"';
      setting['SWIFT_COMPILATION_MODE'] = 'wholemodule';
      setting['CODE_SIGN_IDENTITY'] = '"iPhone Distribution"';
    } else {
      setting['SWIFT_OPTIMIZATION_LEVEL'] = '"-Onone"';
    }

    if (setting['PRODUCT_NAME'] === '"WatchApp"') {
      setting['CODE_SIGN_ENTITLEMENTS'] = '"cs-watchapp-ios/WatchApp/CoinSpace WatchApp.entitlements"';
      setting['INFOPLIST_FILE'] = 'cs-watchapp-ios/WatchApp/WatchApp-Info.plist';
      setting['ASSETCATALOG_COMPILER_APPICON_NAME'] = 'AppIcon';
      if (name === 'Release') {
        setting['PROVISIONING_PROFILE_SPECIFIER'] = '"com.coinspace.wallet.watchapp (production)"';
      } else {
        setting['PROVISIONING_PROFILE_SPECIFIER'] = 'com.coinspace.wallet.watchapp';
      }
    } else if (setting['PRODUCT_NAME'] === '"WatchAppExtension"') {
      setting['SWIFT_OBJC_BRIDGING_HEADER'] = '""';
      setting['CODE_SIGN_ENTITLEMENTS'] = '"cs-watchapp-ios/WatchAppExtension/CoinSpace WatchApp Extension.entitlements"';
      setting['INFOPLIST_FILE'] = 'cs-watchapp-ios/WatchAppExtension/WatchAppExtension-Info.plist';
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
}

async function addWidget(repo) {
  cloneRepo(repo);

  const project = await getXcodeProject();
  const WidgetExtension = addFolderToProject('WidgetExtension', path.join(buildPath, 'platforms/ios/cs-widget-ios'), project);

  // add new target
  const WidgetExtensionTarget = project.addTarget('WidgetExtension', 'app_extension', 'WidgetExtension', 'com.coinspace.wallet.widget');

  // edit XCBuildConfiguration
  const pbxXCBuildConfigurationSection = project.pbxXCBuildConfigurationSection();
  Object.keys(pbxXCBuildConfigurationSection).forEach((key) => {
    const setting = pbxXCBuildConfigurationSection[key].buildSettings;
    if (!setting) return;
    if (!setting['PRODUCT_BUNDLE_IDENTIFIER']) return;
    if (!['"WidgetExtension"'].includes(setting['PRODUCT_NAME'])) return;

    const { name } = pbxXCBuildConfigurationSection[key];

    setting['CODE_SIGN_STYLE'] = 'Manual';
    setting['DEVELOPMENT_TEAM'] = '3M4KWD4BUU';
    setting['MARKETING_VERSION'] = VERSION;
    setting['CURRENT_PROJECT_VERSION'] = BUILD_NUMBER;
    setting['SWIFT_VERSION'] = '5.0';
    setting['IPHONEOS_DEPLOYMENT_TARGET'] = '17.0';
    setting['GENERATE_INFOPLIST_FILE'] = 'YES';
    setting['INFOPLIST_FILE'] = 'cs-widget-ios/WidgetExtension/Info.plist';
    setting['TARGETED_DEVICE_FAMILY'] = '"1,2"';
    setting['ENABLE_BITCODE'] = 'NO';
    setting['ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES'] = 'NO';

    if (name === 'Release') {
      setting['SWIFT_OPTIMIZATION_LEVEL'] = '"-O"';
      setting['SWIFT_COMPILATION_MODE'] = 'wholemodule';
      setting['CODE_SIGN_IDENTITY'] = '"iPhone Distribution"';
    } else {
      setting['SWIFT_OPTIMIZATION_LEVEL'] = '"-Onone"';
    }

    if (name === 'Release') {
      setting['PROVISIONING_PROFILE_SPECIFIER'] = '"com.coinspace.wallet.widget (production)"';
    } else {
      setting['PROVISIONING_PROFILE_SPECIFIER'] = 'com.coinspace.wallet.widget';
    }
  });

  project.addBuildPhase(WidgetExtension.files.filter((f) => /\.swift$/.test(f)), 'PBXSourcesBuildPhase', 'Sources', WidgetExtensionTarget.uuid);

  project.addBuildPhase(
    WidgetExtension.files.filter((f) => /(\.xcassets|\.xcstrings)$/.test(f)),
    'PBXResourcesBuildPhase',
    'Resources',
    WidgetExtensionTarget.uuid
  );

  fs.writeFileSync(project.filepath, project.writeSync());
}

async function addPods() {
  // add pods
  const watchAppPodfile = fs.readFileSync(path.resolve(buildPath, 'platforms/ios/cs-watchapp-ios/WatchAppExtension/Podfile'));
  fs.appendFileSync(path.resolve(buildPath, 'platforms/ios/Podfile'), watchAppPodfile);
  const widgetPodfile = fs.readFileSync(path.resolve(buildPath, 'platforms/ios/cs-widget-ios/WidgetExtension/Podfile'));
  fs.appendFileSync(path.resolve(buildPath, 'platforms/ios/Podfile'), widgetPodfile);

  const postInstall = `
    post_install do |installer|
      installer.pods_project.targets.each do |target|
        target.build_configurations.each do |config|
          config.build_settings['ENABLE_BITCODE'] = 'NO'
        end
      end

      # Strip bitcode from all frameworks
      Dir.glob("Pods/**/*.framework").each do |framework|
        framework_binary = "#{framework}/#{File.basename(framework, '.framework')}"
        if File.exist?(framework_binary)
          puts "Stripping bitcode from #{framework_binary}"
          system("xcrun bitcode_strip #{framework_binary} -r -o #{framework_binary}")
        end
      end
    end\n`.replace(/^ {4}/gm, '');

  fs.appendFileSync(path.resolve(buildPath, 'platforms/ios/Podfile'), postInstall);

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

function addFolderToProject(folderPath, basePath, project, isChild) {
  const folder = path.basename(folderPath);
  const paths = fs.readdirSync(path.resolve(basePath, folderPath));
  let files = [];
  const childs = [];
  paths.forEach((f) => {
    if (f.startsWith('.')) return;
    const s = fs.statSync(path.resolve(basePath, folderPath, f));
    if (s.isFile() || path.extname(f) === '.xcassets') {
      files.push(path.resolve(basePath, folderPath, f));
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

function cloneRepo(repo) {
  const [repoUrl, commit] = repo.split('#');
  const cwd = path.join(buildPath, 'platforms/ios');
  shell(`git clone ${repoUrl}`, { cwd });
  const name = path.basename(repoUrl, '.git');
  shell(`cd ${name} && git checkout ${commit} -q`, { cwd });
}

process.on('unhandledRejection', (err) => {
  throw err;
});

run();
