import Ractive from 'lib/ractive';
import showEosSetupAccount from 'widgets/modals/eos-setup-account';
import template from './index.ract';

export default function(el) {
  const ractive = new Ractive({
    el,
    template,
  });

  ractive.on('setup', showEosSetupAccount);

  return ractive;
}
