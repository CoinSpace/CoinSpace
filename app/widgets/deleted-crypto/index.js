import Ractive from 'lib/ractive';
import exportPrivateKeys from 'widgets/modals/export-private-keys';
import template from './index.ract';

export default function(el) {
  const ractive = new Ractive({
    el,
    template,
  });

  ractive.on('export', exportPrivateKeys);
  ractive.on('info', () => {
    return window.safeOpen('https://support.coin.space/hc/en-us/articles/4416179859220', '_blank');
  });

  return ractive;
}
