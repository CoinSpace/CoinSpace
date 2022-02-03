import Ractive from 'lib/ractive';
import updater from 'lib/updater';
import template from './index.ract';

export default function(el) {
  const ractive = new Ractive({
    el,
    template,
    data: {
      version: process.env.VERSION,
      platform: process.env.PLATFORM,
      commit: process.env.COMMIT,
      hasUpdate: updater.hasUpdate(),
    },
  });

  ractive.on('back', () => {
    ractive.fire('change-step', { step: 'main' });
  });

  ractive.on('terms', () => {
    window.safeOpen('https://coin.space/terms-of-service/', '_blank');
  });

  ractive.on('privacy', () => {
    window.safeOpen('https://coin.space/privacy-policy/', '_blank');
  });

  ractive.on('confirmUpdate', updater.confirmUpdate);

  return ractive;
}
