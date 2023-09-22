import appxmanifest from './support/appxmanifest.js';
import fs from 'node:fs/promises';
import setLanguages from 'electron-packager-languages';
const schemes = [
  'coinspace',
  ...(await import('./lib/schemes.js')).default.map((item) => item.scheme),
];

// TODO load from app
const languages = ['en', 'ru'];
const pkg = JSON.parse(await fs.readFile('./package.json'));

const { BUILD_PLATFORM } = process.env;
//const BRANCH = process.env.GITHUB_REF && process.env.GITHUB_REF.replace('refs/heads/', '');

if (!['win', 'appx', 'appx-dev', 'mac', 'mas', 'mas-dev', 'snap'].includes(BUILD_PLATFORM)) {
  throw new Error(`Please specify valid distribution, provided: '${BUILD_PLATFORM}'`);
}

let buildVersion = pkg.version;

if (BUILD_PLATFORM === 'mas' && process.env.GITHUB_RUN_NUMBER) {
  buildVersion = `1.1.${process.env.GITHUB_RUN_NUMBER}`;
}

const protocols = {
  name: pkg.productName,
  schemes,
};
const appxPackageName = BUILD_PLATFORM === 'appx' ? 'CoinWallet' : 'CoinWalletDev';

export default {
  packagerConfig: {
    appVersion: pkg.version,
    buildVersion,
    //asar: true,
    icon: 'resources/icon',
    executableName: ['win', 'appx', 'appx-dev'].includes(BUILD_PLATFORM) ? pkg.productName : pkg.executableName,
    ignore: [
      /README.md/i,
      /HISTORY.md/i,
      /CHANGELOG.md/i,
      '^/(?!electron.js|package.json|lib|dist|resources|node_modules)',
      ['win', 'appx', 'appx-dev', 'snap'].includes(BUILD_PLATFORM) ? '^/resources/(?!64x64.png)' : '^/resources',
      'Makefile',
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
    protocols,
    afterCopy: [
      ...(['mac', 'mas', 'mas-dev'].includes(BUILD_PLATFORM) ? [setLanguages(languages.map((item) => {
        return item.replace('-', '_').replace(/_[a-z]+/, s => s.toUpperCase());
      }))] : []),
      ...(['appx', 'appx-dev'].includes(BUILD_PLATFORM) ? [appxmanifest({
        packageVersion: `${pkg.version}.0`,
        identityName: BUILD_PLATFORM === 'appx' ? process.env.APPX_IDENTITY : pkg.executableName,
        packageName: appxPackageName,
        packageDescription: pkg.description,
        //packageDisplayName: process.env.APPX_PACKAGE_NAME,
        packageDisplayName: pkg.productName,
        publisherName: BUILD_PLATFORM === 'appx' ? process.env.APPX_PUBLISHER : process.env.APPX_PUBLISHER_DEV,
        publisherDisplayName: process.env.APPX_PUBLISHER_NAME,
        packageExecutable: `app\\${pkg.productName}.exe`,
        languages: languages.map((lang) => {
          // https://docs.microsoft.com/en-us/windows/uwp/publish/supported-languages
          switch (lang) {
            case 'sr':
              return 'sr-Latn';
            default:
              return lang;
          }
        }),
        protocols,
      })] : []),
    ],
  },
  makers: [
    BUILD_PLATFORM === 'appx' && {
      name: '@electron-forge/maker-appx',
      config: {
        packageName: appxPackageName,
        identityName: process.env.APPX_IDENTITY,
        publisher: process.env.APPX_PUBLISHER,
        assets: 'resources/appx',
        manifest: 'resources/appxmanifest.xml',
        makePri: true,
      },
    },
    BUILD_PLATFORM === 'appx-dev' && {
      name: '@electron-forge/maker-appx',
      config: {
        packageName: appxPackageName,
        identityName: pkg.name,
        publisher: process.env.APPX_PUBLISHER_DEV,
        devCert: 'resources/certificate.pfx',
        certPass: process.env.CERTIFICATE_SELFSIGN_WIN_PASSWORD,
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
      name: '@electron-forge/maker-pkg',
      platforms: [
        'mas',
      ],
      config: {
        name: `${pkg.productName}-${pkg.version}${BUILD_PLATFORM === 'mas-dev' ? '-dev': ''}.pkg`,
      },
    },
    /*{
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
        protocols,
        publish: BRANCH === 'master' ? 'always' : 'never',
      },
    },*/
  ].filter(item => !!item),
  /*
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
  */
};
