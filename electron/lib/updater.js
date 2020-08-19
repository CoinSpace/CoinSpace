'use strict';

const { app, autoUpdater, dialog } = require('electron');

const supportedDistribution = ['mac', 'win'];
const {
  SITE_URL,
  BUILD_PLATFORM,
} = process.env;

module.exports = function updater(opts = {}) {
  const log = opts.log;
  if (!supportedDistribution.includes(BUILD_PLATFORM)) {
    log.log(`Electron's auto updater does not support the '${BUILD_PLATFORM}' distribution`);
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    log.log(`Electron's auto updater must be used in production environment`);
    return;
  }

  const feedURL = `${SITE_URL}v1/update/${BUILD_PLATFORM}/${process.arch}/${app.getVersion()}`;
  const requestHeaders = {
    'User-Agent': `CoinSpace/${BUILD_PLATFORM}/${app.getVersion()} (${process.platform}: ${process.arch})`,
  };

  log.log('feedURL:', feedURL);
  log.log('requestHeaders:', requestHeaders);

  try {
    autoUpdater.setFeedURL(feedURL, requestHeaders);
  } catch (err) {
    log.log('updater set feed error:', err);
    return;
  }

  autoUpdater.on('error', err => {
    log.log('updater error:', err);
  });

  autoUpdater.on('checking-for-update', () => {
    log.log('checking-for-update');
  });

  autoUpdater.on('update-available', () => {
    log.log('update-available; downloading...');
  });

  autoUpdater.on('update-not-available', () => {
    log.log('update-not-available');
  });


  autoUpdater.on('update-downloaded', async (event, releaseNotes, releaseName, releaseDate, updateURL) => {
    log.log('update-downloaded:', {
      event,
      releaseNotes,
      releaseName,
      releaseDate,
      updateURL,
    });

    const response = await dialog.showMessageBox({
      type: 'info',
      buttons: ['Restart', 'Later'],
      defaultId: 0,
      title: 'Application Update',
      message: releaseName,
      detail: 'A new version has been downloaded. Restart the application to apply the updates.',
    });

    if (response.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });

  // check for updates right away and keep checking later
  autoUpdater.checkForUpdates();
  setInterval(() => { autoUpdater.checkForUpdates(); }, 15 * 60 * 60 * 1000);
};
