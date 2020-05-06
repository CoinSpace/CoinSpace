'use strict';

const path = require('path');
const { notarize } = require('electron-notarize');

module.exports = async (context) => {
  const { electronPlatformName } = context;
  if (electronPlatformName === 'darwin' && !!process.env.NOTARIZE) {
    const appPath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
    try {
      console.log('Try notarize app');
      await notarize({
        appBundleId: context.packager.config.appId,
        appPath,
        appleId: process.env.APPLE_ID,
        appleIdPassword: process.env.APPLE_PASSWORD,
      });
      console.log('Success notarize');
    } catch (err) {
      console.log(err);
    }
  }
};
