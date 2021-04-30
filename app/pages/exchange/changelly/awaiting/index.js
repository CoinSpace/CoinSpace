import Ractive from 'lib/ractive';
import emitter from 'lib/emitter';
import { showInfo } from 'widgets/modals/flash';
import template from './index.ract';
import footer from '../footer.ract';

export default function(el) {
  const ractive = new Ractive({
    el,
    template,
    data: {},
    partials: {
      footer,
    },
  });

  const delay = 60 * 1000; // 60 seconds
  let interval;

  ractive.on('before-show', (context) => {
    if (context.status === 'hold') {
      showInfo({
        isHtml: true,
        title: 'On hold...',
        message: 'Currently, your transaction (ID: :id) is on hold.<br>Please, contact Changelly to pass KYC.',
        href: 'mailto:security@changelly.com',
        linkText: 'security@changelly.com',
        interpolations: {
          id: context.id,
        },
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
