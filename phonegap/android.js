/* eslint-disable max-len */

import { Storage } from '@google-cloud/storage';
import ejs from 'ejs';
import fs from 'fs';
import path from 'path';
const cordovaRun = process.argv[2] === '--run';
import { cordova as Cordova, shell } from './utils.js';

const buildPath = 'build';
const cordova = Cordova(buildPath);

const storage = new Storage();
const BUILD_NUMBER = parseInt(process.env.GITHUB_RUN_NUMBER || '1') + 2530;
const BRANCH = process.env.GITHUB_REF && process.env.GITHUB_REF.replace('refs/heads/', '');
const VERSION = process.env.npm_package_version;
const NAME = process.env.npm_package_name;

async function run() {
  const files = fs.readdirSync(buildPath);
  for (const file of files) {
    if (file === 'www') continue;
    fs.rmSync(path.resolve(buildPath, file), { force: true, recursive: true });
  }

  const config = ejs.render(fs.readFileSync('config.xml.template', 'utf-8'), {
    widget: {
      id: 'com.coinspace.app',
      name: 'Coin Wallet',
      version: VERSION,
      androidVersionCode: BUILD_NUMBER,
    },
  });
  fs.writeFileSync(path.resolve(buildPath, 'config.xml'), config);
  cordova('platform add android@12.0.1 --save');

  cordova('plugin add cordova-plugin-androidx-adapter@1.1.3 --save');
  cordova('plugin add cordova-plugin-geolocation@5.0.0 --save');
  cordova('plugin add https://github.com/js-soft/phonegap-plugin-barcodescanner#57830dc1133e131f6094d6bb9a63175af508ab5c --save --variable ANDROID_SUPPORT_V4_VERSION=28.0.0');
  cordova('plugin add cordova-plugin-dialogs@2.0.2 --save');
  cordova('plugin add cordova-plugin-inappbrowser@5.0.0 --save');
  cordova('plugin add cordova-plugin-x-socialsharing@6.0.4 --save');
  cordova('plugin add cordova-plugin-fingerprint-aio@5.0.1 --save');
  cordova('plugin add cordova-plugin-customurlscheme@5.0.2 --save --variable URL_SCHEME=coinspace');
  cordova('plugin add https://github.com/CoinSpace/cordova-plugin-zendesk#4bf28de7fcd6759450f5fd56f2ec28677bc882da --save');
  cordova('plugin add cordova-plugin-safariviewcontroller@2.0.0 --save');
  cordova('plugin add cordova-plugin-app-review@3.1.0 --save');
  cordova('plugin add cordova-plugin-velda-devicefeedback@0.0.2 --save');
  cordova('plugin add cordova-clipboard@1.3.0 --save');

  cordova('prepare android');
  fixAndroidManifest();

  if (process.env.CI) {
    cordova('compile android --release -- --packageType=apk');
    shell(
      'zipalign -f 4 platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk \
      ../deploy/coinspace-release.apk',
      { cwd: buildPath }
    );
    shell(
      'apksigner sign --ks-pass=pass:coinspace -ks ../release.keystore \
      ../deploy/coinspace-release.apk',
      { cwd: buildPath }
    );
    const destination = `${VERSION}-${BRANCH || 'local'}/${NAME}-${process.env.VITE_DISTRIBUTION}-${VERSION}`;
    await storage.bucket(process.env.GOOGLE_CLOUD_BUCKET).upload('deploy/coinspace-release.apk', { destination: `${destination}.apk` });

    cordova('compile android --release -- --packageType=bundle --keystore=../release.keystore --alias=upload --storePassword=coinspace --password=coinspace');
    await storage.bucket(process.env.GOOGLE_CLOUD_BUCKET).upload('build/platforms/android/app/build/outputs/bundle/release/app-release.aab', { destination: `${destination}.aab` });
  } else {
    cordova('compile android');
  }
}

function fixAndroidManifest() {
  const file = path.resolve(buildPath, 'platforms/android/app/src/main/AndroidManifest.xml');
  let data = fs.readFileSync(file, 'utf-8');
  const features = [
    'android.hardware.touchscreen',
    'android.hardware.camera',
    'android.hardware.location.gps',
  ];
  features.forEach((feature) => {
    data = data.replace(new RegExp(`\\s*<uses-feature android:name="${feature.replace(/\./g, '\\.')}".+/>`, 'g'), '');
    data = data.replace('</manifest>', `    <uses-feature android:name="${feature}" android:required="false" />\n</manifest>`);
  });
  fs.writeFileSync(file, data);
}

process.on('unhandledRejection', (err) => {
  throw err;
});

if (cordovaRun) {
  cordova('run android --noprepare --nobuild');
  process.exit(0);
}

run();
