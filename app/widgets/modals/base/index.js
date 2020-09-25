'use strict';

const Ractive = require('lib/ractive');
const { fadeIn } = require('lib/transitions/fade.js');
const { fadeOut } = require('lib/transitions/fade.js');

const Modal = Ractive.extend({
  el: document.getElementById('general-purpose-overlay'),
  template: require('./index.ract'),
  partials: {
    content: require('./content.ract'),
  },
  onrender() {

    document.getElementsByTagName('html')[0].classList.add(`${this.el.id}--shown`);

    const self = this;
    const fadeEl = self.find('.js__fadeEl');

    fadeIn(fadeEl, self.get('fadeInDuration'), () => {
      fadeEl.focus();
      const onFocus = self.get('onFocus');
      if (onFocus) onFocus();
    });

    self.on('cancel', (context) => {
      if (!context.node) return dismissModal();
      const originalElement = context.original.srcElement || context.original.originalTarget;
      if (originalElement.classList && originalElement.classList.contains('_cancel')) {
        if (self.get('hasIframe')) self.fire('ios-blur');
        dismissModal();
      }
    });

    self.on('ios-blur', () => {
      // fix ios iframe focus
      const hiddenInput = self.find('#modal-hidden-input');
      hiddenInput.focus();
      hiddenInput.blur();
    });

    function dismissModal() {
      const onDismiss = self.get('onDismiss');
      if (onDismiss) onDismiss();
      fadeOut(fadeEl, () => {
        document.getElementsByTagName('html')[0].classList.remove(`${self.el.id}--shown`);
        self.teardown();
      });
    }
  },
});

module.exports = Modal;

