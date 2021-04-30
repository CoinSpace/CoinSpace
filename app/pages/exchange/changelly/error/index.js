import Ractive from 'lib/ractive';
import emitter from 'lib/emitter';
import details from 'lib/wallet/details';
import { translate } from 'lib/i18n';
import template from './index.ract';
import footer from '../footer.ract';

export default function(el) {
  const ractive = new Ractive({
    el,
    template,
    data: {
      message: '',
      showEmail: true,
    },
    partials: {
      footer,
    },
  });

  ractive.on('before-show', (context) => {
    ractive.set('message', translate(context.message, context.interpolations));
    ractive.set('showEmail', !!context.showEmail);
  });

  ractive.on('close', () => {
    details.set('changellyInfo', null).then(() => {
      emitter.emit('change-changelly-step', 'enterAmount');
    }).catch((err) => {
      console.error(err);
    });
  });

  return ractive;
}
