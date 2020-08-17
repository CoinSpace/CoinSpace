'use strict';

const fse = require('fs-extra');
const path = require('path');
const ejs = require('ejs');
const utils = require('../cli/utils');
const pkg = require('../package.json');
const { Storage } = require('@google-cloud/storage');
const storage = new Storage();
const buildPath = 'build';
const cordova = utils.cordova(buildPath);

const BUILD_NUMBER = parseInt(process.env.TRAVIS_BUILD_NUMBER || '1') + 2187;

async function run() {
  const config = ejs.render(fse.readFileSync('config.xml.template', 'utf-8'), {
    widget: {
      id: 'com.coinspace.app',
      version: pkg.version,
      androidVersionCode: BUILD_NUMBER,
    }
  });
  fse.writeFileSync(path.resolve(buildPath, 'config.xml'), config);

  /* eslint-disable max-len */
  cordova('platform add android@8.1.0');
  cordova('plugin add cordova-custom-config@5.1.0');
  cordova('plugin add cordova-plugin-geolocation@4.0.2');
  cordova('plugin add phonegap-plugin-barcodescanner@8.1.0');
  cordova('plugin add cordova-plugin-dialogs@2.0.2');
  cordova('plugin add cordova-plugin-inappbrowser@4.0.0');
  cordova('plugin add cordova-plugin-x-socialsharing@5.6.8');
  cordova('plugin add cordova-plugin-fingerprint-aio@3.0.1');
  cordova('plugin add cordova-plugin-customurlscheme@5.0.1 --variable URL_SCHEME=coinspace');
  cordova('plugin add https://github.com/CoinSpace/cordova-plugin-zendesk#23f993dc73feafbf8eb00496f9a5da0884374a10');
  cordova('plugin add cordova-plugin-cookiemaster@1.0.5');
  cordova('plugin add cordova-plugin-splashscreen@5.0.4');
  cordova('plugin add cordova-plugin-whitelist@1.3.4');
  cordova('plugin add cordova-plugin-safariviewcontroller@1.6.0');
  cordova('plugin add cordova-plugin-inapp-review@1.1.0 --variable PLAY_CORE_VERSION=1.8.0');

  if (process.env.RELEASE) {
    cordova('build android --release');
    utils.shell(
      `jarsigner -sigalg SHA1withRSA -digestalg SHA1 -keystore ../release.keystore \
      -storepass coinspace platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk coinspace`,
      { cwd: buildPath }
    );
    utils.shell(
      `zipalign -f 4 platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk \
      ../deploy/coinspace-release.apk`,
      { cwd: buildPath }
    );
    const destination = `${pkg.version}-${process.env.TRAVIS_BRANCH || 'local'}/${pkg.name}-${pkg.version}.apk`;
    await storage.bucket('coinspace-travis-ci').upload('deploy/coinspace-release.apk', { destination });
  } else {
    cordova('build android');
  }
}

process.on('unhandledRejection', function(err) {
  throw err;
});

run();
