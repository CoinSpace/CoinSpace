import Ractive from '../ractive';
import emitter from 'lib/emitter';
import details from 'lib/wallet/details';
import template from './index.ract';

export default function(el) {
  const ractive = new Ractive({
    el,
    template,
    data: {
      message: '',
      showEmail: true,
    },
  });

  ractive.on('before-show', (context) => {
    ractive.set('message', context.message);
    ractive.set('showEmail', !!context.showEmail);
  });

  ractive.on('close', () => {
    details.set('changellyInfo', null).then(() => {
      emitter.emit('change-changelly-step', 'create');
    }).catch((err) => {
      console.error(err);
    });
  });

  return ractive;
}
