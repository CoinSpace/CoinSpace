'use strict';

const setLanguages = require('electron-packager-languages');
const pkg = require('./package.json');
const schemes = require('./lib/schemes');
const languages = require('../app/lib/i18n/list.json');
const appxmanifest = require('./support/appxmanifest');

const { BUILD_PLATFORM } = process.env;
const BRANCH = process.env.APPVEYOR_REPO_BRANCH ||
  (process.env.GITHUB_REF && process.env.GITHUB_REF.replace('refs/heads/', ''));

if (!['win', 'appx', 'appx-dev', 'mac', 'mas', 'mas-dev', 'snap'].includes(BUILD_PLATFORM)) {
  throw new Error(`Please specify valid distribution, provided: '${BUILD_PLATFORM}'`);
}

let buildVersion = pkg.version;

if (BUILD_PLATFORM === 'mas' && process.env.GITHUB_RUN_NUMBER) {
  buildVersion = `1.1.${process.env.GITHUB_RUN_NUMBER}`;
}

module.exports = {
  packagerConfig: {
    appVersion: pkg.version,
    buildVersion,
    //asar: true,
    icon: 'resources/icon',
    executableName: ['win', 'appx', 'appx-dev'].includes(BUILD_PLATFORM) ? pkg.productName : pkg.name,
    ignore: [
      /README.md/i,
      /HISTORY.md/i,
      /CHANGELOG.md/i,
      '^/(?!electron.js|env.json|package.json|lib|app|resources|node_modules)',
      ['win', 'appx', 'appx-dev', 'snap'].includes(BUILD_PLATFORM) ? '^/resources/(?!64x64.png)' : '^/resources',
      'Makefile',
      'appveyor.yml',
      '.editorconfig',
      '.gitignore',
      '.gitattributes',
      '.nvmrc',
      '.npmignore',
      '.nycrc',
      '.jsfmtrc',
      '.eslintrc',
      '.eslintignore',
      '.github',
      '.coveralls.yml',
      '.istanbul.yml',
      '.jscs.json',
      'Thumbs.db',
    ],
    appBundleId: 'com.coinspace.wallet',
    appCategoryType: 'public.app-category.finance',
    osxSign: {
      'gatekeeper-assess': false,
      identity: process.env.APPLE_IDENTITY,
      type: BUILD_PLATFORM === 'mas-dev' ? 'development' : 'distribution',
      ...(BUILD_PLATFORM === 'mac'? {
        'hardened-runtime': true,
        entitlements: 'resources/entitlements.mac.plist',
        'entitlements-inherit': 'resources/entitlements.mac.plist',
      } : {}),
      ...(['mas', 'mas-dev'].includes(BUILD_PLATFORM) ? {
        'hardened-runtime': false,
        entitlements: 'resources/entitlements.mas.plist',
        'entitlements-inherit': 'resources/entitlements.mas.inherit.plist',
      } : {}),
    },
    osxNotarize: (BUILD_PLATFORM === 'mac' && process.env.APPLE_ID && process.env.APPLE_PASSWORD) ? {
      appBundleId: 'com.coinspace.wallet',
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_PASSWORD,
    } : undefined,
    protocols: {
      name: 'Coin Wallet',
      schemes,
    },
    afterCopy: [
      ...(['mac', 'mas', 'mas-dev'].includes(BUILD_PLATFORM) ? [setLanguages(languages.map((item) => {
        return item.replace('-', '_').replace(/_[a-z]+/, s => s.toUpperCase());
      }))] : []),
      ...(['appx', 'appx-dev'].includes(BUILD_PLATFORM) ? [appxmanifest({
        packageVersion: `${pkg.version}.0`,
        identityName: BUILD_PLATFORM === 'appx' ? process.env.APPX_IDENTITY : pkg.name,
        packageName: BUILD_PLATFORM === 'appx' ? 'CoinWallet' : 'CoinWalletDev',
        packageDescription: pkg.description,
        packageDisplayName: process.env.APPX_PACKAGE_NAME,
        publisherName: BUILD_PLATFORM === 'appx' ? process.env.APPX_PUBLISHER : process.env.APPX_PUBLISHER_DEV,
        publisherDisplayName: process.env.APPX_PUBLISHER_NAME,
        packageExecutable: `app\\${pkg.productName}.exe`,
        languages,
        protocols: {
          name: 'Coin Wallet',
          schemes,
        },
      })] : []),
    ],
  },
  makers: [
    BUILD_PLATFORM === 'win' && {
      name: '@electron-forge/maker-squirrel',
      config: {
        // App ID
        name: 'com.coinspace.wallet',
        setupExe: `${pkg.productName} Setup.exe`,
        setupIcon: 'resources/icon.ico',
        loadingGif: 'resources/loading.gif',
        certificateFile: 'resources/certificate.pfx',
        certificatePassword: process.env.CERTIFICATE_WIN_PASSWORD,
        //remoteReleases: 'https://github.com/CoinSpace/CoinSpace',
      },
    },
    BUILD_PLATFORM === 'appx' && {
      name: '@electron-forge/maker-appx',
      config: {
        packageName: 'CoinWallet',
        publisher: process.env.APPX_PUBLISHER,
        assets: 'resources/appx',
        manifest: 'resources/appxmanifest.xml',
        makePri: true,
      },
    },
    BUILD_PLATFORM === 'appx-dev' && {
      name: '@electron-forge/maker-appx',
      config: {
        packageName: 'CoinWalletDev',
        publisher: process.env.APPX_PUBLISHER_DEV,
        devCert: 'resources/certificate.pfx',
        certPass: process.env.CERTIFICATE_WIN_PASSWORD,
        assets: 'resources/appx',
        manifest: 'resources/appxmanifest.xml',
        makePri: true,
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: [
        'darwin',
      ],
    },
    {
      name: '@electron-forge/maker-dmg',
      platforms: [
        'darwin',
      ],
      config: {
        name: pkg.productName,
        title: `${pkg.productName} ${pkg.version}`,
        icon: 'resources/icon.icns',
        background: 'resources/background.tiff',
        contents: (opts) => {
          return [{
            x: 130, y: 220, type: 'file', path: opts.appPath,
          }, {
            x: 410, y: 220, type: 'link', path: '/Applications',
          }];
        },
        additionalDMGOptions: {
          window: {
            position: {
              x: 400,
              y: 100,
            },
            size: {
              width: 540,
              height: 380,
            },
          },
        },
      },
    },
    {
      name: '@mahnunchik/maker-pkg',
      platforms: [
        'mas',
      ],
      config: {
        name: `${pkg.productName}-${pkg.version}${BUILD_PLATFORM === 'mas-dev' ? '-dev': ''}.pkg`,
      },
    },
    {
      name: './support/snap',
      config: {
        linux: {
          icon: 'resources/icon.icns',
        },
        snap: {
          summary: pkg.description,
          category: 'Office;Finance',
          publish: {
            provider: 'snapStore',
            channels: ['edge'],
          },
          plugs: ['default', 'u2f-devices'],
        },
        protocols: {
          name: 'Coin Wallet',
          schemes,
        },
        publish: BRANCH === 'master' ? 'always' : 'never',
      },
    },
  ].filter(item => !!item),
  publishers: [
    ['mac', 'win'].includes(BUILD_PLATFORM) && BRANCH === 'master' && {
      name: '@mahnunchik/publisher-github',
      config: {
        repository: {
          owner: 'CoinSpace',
          name: 'CoinSpace',
        },
        draft: true,
        override: true,
      },
    },
    {
      name: '@mahnunchik/publisher-gcs',
      config: {
        bucket: process.env.GOOGLE_CLOUD_BUCKET,
        folder: `${pkg.version}-${BRANCH || 'local'}`,
        public: false,
      },
    },
  ].filter(item => !!item),
};
