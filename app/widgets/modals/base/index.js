import Ractive from 'lib/ractive';
import { fadeIn } from 'lib/transitions/fade.js';
import { fadeOut } from 'lib/transitions/fade.js';
import template from './index.ract';
import content from './content.ract';
import cross from './cross.ract';

const Modal = Ractive.extend({
  el: document.getElementById('general-purpose-overlay'),
  template,
  partials: {
    content,
    cross,
  },
  onrender() {

    document.getElementsByTagName('html')[0].classList.add(`${this.el.id}--shown`);
    const self = this;
    const $modal = self.find('.js-modal');

    fadeIn($modal, { duration: self.get('fadeInDuration') }, () => {
      const $container = self.find('.js-container');
      if ($container) $container.focus();
      const onFocus = self.get('onFocus');
      if (onFocus) onFocus();
    });

    self.on('cancel', (context) => {
      if (!context.node) return dismissModal();
      const originalElement = context.original.srcElement || context.original.originalTarget;
      if (originalElement.classList && originalElement.classList.contains('overlay__container')) {
        dismissModal();
      }
    });

    self.on('close', () => {
      self.fire('cancel');
    });

    function dismissModal() {
      const onDismiss = self.get('onDismiss');
      if (onDismiss) onDismiss();
      fadeOut($modal, () => {
        document.getElementsByTagName('html')[0].classList.remove(`${self.el.id}--shown`);
        self.teardown();
      });
    }
  },
});

export default Modal;

