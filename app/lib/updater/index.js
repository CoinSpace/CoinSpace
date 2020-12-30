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
  const arch = (window.process && window.process.arch) || 'any';
  try {
    update = await request({
      url: `${urlRoot}api/v1/update/${process.env.BUILD_PLATFORM}/${arch}/${process.env.VERSION}`,
      method: 'get',
    });
    if (!update) return;

    const isSkipped = update.version === localStorage.getItem('_cs_update_shown');
    if (isSkipped) return;

    showUpdate({ confirmUpdate });
    localStorage.setItem('_cs_update_shown', update.version);
  } catch (err) {
    console.error(err);
  }
}

function confirmUpdate() {
  if (!update) return;
  if (process.env.BUILD_PLATFORM === 'web') return location.reload();
  window.safeOpen(update.url, '_blank');
}

module.exports = {
  init,
  confirmUpdate,
  hasUpdate: () => !!update,
};
