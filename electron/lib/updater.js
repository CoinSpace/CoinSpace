import log from 'electron-log';
import { app, autoUpdater, dialog } from 'electron';

import {
  VITE_DISTRIBUTION,
  VITE_SITE_URL,
  isDevelopment,
} from './constants.js';

const supportedDistribution = ['mac'];

class Updater {
  constructor() {
    this.state = 'update-not-available';
    this.supported = false;

    if (!supportedDistribution.includes(VITE_DISTRIBUTION)) {
      log.info(`Electron's auto updater does not support the '${VITE_DISTRIBUTION}' distribution`);
      return this;
    }

    if (isDevelopment) {
      log.info('Electron\'s auto updater must be used in production environment');
      return this;
    }

    const feedURL = `${VITE_SITE_URL}api/v4/update/${VITE_DISTRIBUTION}/${process.arch}/v${app.getVersion()}`;
    const requestHeaders = {
      'User-Agent': `CoinSpace/${VITE_DISTRIBUTION}/${app.getVersion()} (${process.platform}: ${process.arch})`,
    };

    log.info('feedURL:', feedURL);
    log.info('requestHeaders:', requestHeaders);

    try {
      autoUpdater.setFeedURL(feedURL, requestHeaders);
    } catch (err) {
      log.error('updater set feed error:', err);
      return this;
    }

    this.supported = true;

    autoUpdater.on('error', err => {
      this.state = 'error';
      log.error('updater error:', err);
    });

    autoUpdater.on('checking-for-update', () => {
      this.state = 'checking-for-update';
      log.info('checking-for-update');
    });

    autoUpdater.on('update-available', () => {
      this.state = 'update-available';
      log.info('update-available; downloading...');
    });

    autoUpdater.on('update-not-available', () => {
      this.state = 'update-not-available';
      log.info('update-not-available');
    });


    autoUpdater.on('update-downloaded', async (event, releaseNotes, releaseName, releaseDate, updateURL) => {
      this.state = 'update-downloaded';
      log.info('update-downloaded:', {
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
        cancelId: 1,
        title: 'Application Update',
        message: releaseName,
        detail: 'A new version has been downloaded. Restart the application to apply the updates.',
      });

      if (response.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  }

  launchCheckForUpdates() {
    if (this.supported) {
      // check for updates right away and keep checking later
      autoUpdater.checkForUpdates();
      setInterval(() => { autoUpdater.checkForUpdates(); }, 12 * 60 * 60 * 1000);
    }
  }

  quitAndInstall() {
    autoUpdater.quitAndInstall();
  }

  checkForUpdates() {
    if (['checking-for-update', 'update-available', 'update-downloaded'].includes(this.state)) {
      log.info(`already checked: ${this.state}`);
      return;
    }
    autoUpdater.checkForUpdates();

    new Promise((resolve) => {
      autoUpdater.once('update-available', () => resolve('update-available'));
      autoUpdater.once('update-not-available', () => resolve('update-not-available'));
      autoUpdater.once('error', () => resolve('error'));
      setTimeout(() => resolve('timeout'), 30 * 1000);
    }).then(async (res) => {
      if (res === 'update-available') {
        await dialog.showMessageBox({
          type: 'info',
          buttons: ['Ok'],
          defaultId: 0,
          cancelId: 0,
          title: 'Application Update',
          message: 'There is update available.',
          detail: 'A new version will be downloaded shortly.',
        });
      } else if (res === 'update-not-available') {
        await dialog.showMessageBox({
          type: 'info',
          buttons: ['Ok'],
          defaultId: 0,
          cancelId: 0,
          title: 'Application Update',
          message: 'There are currently no updates available.',
        });
      }
    });
  }
}

export default new Updater();
