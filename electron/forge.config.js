'use strict';

const pkg = require('./package.json');

const VERSION = process.env.VERSION || pkg.version;
const BUILD_PLATFORM = process.env.BUILD_PLATFORM;

if (!['win', 'mac', 'mas', 'snap'].includes(BUILD_PLATFORM)) {
  throw new Error(`Please specify valid distribution, provided: '${BUILD_PLATFORM}'`);
}

module.exports = {
  packagerConfig: {
    appVersion: VERSION,
    //asar: true,
    icon: 'resources/icon',
    executableName: ['win'].includes(BUILD_PLATFORM) ? pkg.productName : pkg.name,
    ignore: [
      /README.md/i,
      /HISTORY.md/i,
      /CHANGELOG.md/i,
      '^/(?!electron.js|env.json|package.json|lib|app|resources|node_modules)',
      ['win', 'snap'].includes(BUILD_PLATFORM) ? '^/resources/(?!64x64.png)' : '^/resources',
      'Makefile',
      '.travis.yml',
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
    ],
    appBundleId: 'com.coinspace.wallet',
    appCategoryType: 'public.app-category.finance',
    osxSign: {
      'gatekeeper-assess': false,
      identity: process.env.APPLE_IDENTITY,
      ...(BUILD_PLATFORM === 'mac'? {
        'hardened-runtime': true,
        entitlements: 'resources/entitlements.mac.plist',
        'entitlements-inherit': 'resources/entitlements.mac.plist',
      } : {}),
      ...(BUILD_PLATFORM === 'mas'? {
        'hardened-runtime': false,
        entitlements: 'resources/entitlements.mas.plist',
        'entitlements-inherit': 'resources/entitlements.mas.inherit.plist',
        'provisioning-profile': process.env.APPLE_PROVISIONING,
      } : {}),
    },
    osxNotarize: (BUILD_PLATFORM === 'mac' && process.env.APPLE_ID && process.env.APPLE_PASSWORD) ? {
      appBundleId: 'com.coinspace.wallet',
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_PASSWORD,
    } : undefined,
    protocols: {
      name: 'Coin Wallet',
      schemes: ['coinspace'],
    },
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        // App ID
        name: 'com.coinspace.wallet',
        setupExe: `${pkg.productName} Setup.exe`,
        setupIcon: 'resources/icon.ico',
        certificateFile: 'resources/certificate.pfx',
        certificatePassword:  process.env.CERTIFICATE_WIN_PASSWORD,
        //remoteReleases: 'https://github.com/CoinSpace/CoinSpace',
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
        title: `${pkg.productName} ${VERSION}`,
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
        name: `${pkg.productName}-${VERSION}.pkg`,
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
            channels: ['edge', 'stable'],
          },
        },
        publish: process.env.SNAP_TOKEN ? 'always' : 'never',
      },
    },
  ],
  publishers: [
    /*...(['mac', 'win'].includes(BUILD_PLATFORM) ? [{
      name: '@mahnunchik/publisher-github',
      config: {
        repository: {
          owner: 'CoinSpace',
          name: 'CoinSpace',
        },
        draft: true,
        override: true,
      },
    }] : []),*/
    {
      name: '@mahnunchik/publisher-gcs',
      config: {
        bucket: 'coinspace-travis-ci',
        public: false,
      },
    },
  ],
};
