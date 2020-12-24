'use strict';

const request = require('lib/request');
const showUpdate = require('widgets/modals/update');
const { urlRoot, localStorage } = window;

let update = false;

function init() {
  setTimeout(() => {
    checkUpdate();
  }, 1000);

  setInterval(() => {
    checkUpdate();
  }, 12 * 60 * 60 * 1000);
}

async function checkUpdate() {
  const distribution = process.env.BUILD_TYPE === 'web' ? 'web' : process.env.BUILD_PLATFORM;
  const arch = (window.process && window.process.arch) || 'any';
  try {
    update = await request({
      url: `${urlRoot}api/v1/update/${distribution}/${arch}/${process.env.VERSION}`,
      method: 'get',
    });
    if (!update) return;
    update.distribution = distribution;

    const isSkipped = !!localStorage.getItem(`_cs_update_shown_${update.version}`);
    if (isSkipped) return;

    showUpdate({ confirmUpdate });
    localStorage.setItem(`_cs_update_shown_${update.version}`, true);
  } catch (err) {
    console.error(err);
  }
}

function confirmUpdate() {
  if (!update) return;
  if (update.distribution === 'web') return location.reload();
  window.safeOpen(update.url, '_blank');
}

module.exports = {
  init,
  confirmUpdate,
  hasUpdate: () => !!update,
};
