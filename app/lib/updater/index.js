import request from 'lib/request';
import showUpdate from 'widgets/modals/update';
const { localStorage } = window;

let update = false;

function init() {
  setTimeout(() => {
    checkUpdate();
  }, ['win', 'mac'].includes(process.env.BUILD_PLATFORM) ? 5 * 60 * 1000 : 1000);

  setInterval(() => {
    checkUpdate();
  }, 12 * 60 * 60 * 1000);
}

async function checkUpdate() {
  const arch = (['win', 'mac'].includes(process.env.BUILD_PLATFORM) && window.process && window.process.arch) || 'any';
  try {
    update = await request({
      url: `${process.env.SITE_URL}api/v3/update/${process.env.BUILD_PLATFORM}/${arch}/${process.env.VERSION}`,
      method: 'get',
      id: true,
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
  if (process.env.BUILD_TYPE === 'web') return location.reload();
  window.safeOpen(update.url, '_blank');
}

export default {
  init,
  confirmUpdate,
  hasUpdate: () => !!update,
};
