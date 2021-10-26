import Ractive from 'lib/ractive';
import emitter from 'lib/emitter';
import { showInfo } from 'widgets/modals/flash';
import { translate } from 'lib/i18n';
import template from './index.ract';
import footer from '../footer.ract';

export default function(el) {
  const ractive = new Ractive({
    el,
    template,
    data: {
      ref: process.env.CHANGELLY_REF,
    },
    partials: {
      footer,
    },
  });

  const delay = 60 * 1000; // 60 seconds
  let interval;

  ractive.on('before-show', (context) => {
    if (context.status === 'hold') {
      showInfo({
        isHTML: true,
        title: translate('On hold...'),
        // eslint-disable-next-line max-len
        message: translate('Currently, your transaction (ID: :id) is on hold.<br>Please, contact Changelly to pass KYC.',
          { id: context.id }),
        href: 'mailto:security@changelly.com',
        linkText: 'security@changelly.com',
      });
    }

    interval = setInterval(() => {
      emitter.emit('changelly');
    }, delay);
  });

  ractive.on('before-hide', () => {
    clearInterval(interval);
  });

  return ractive;
}
