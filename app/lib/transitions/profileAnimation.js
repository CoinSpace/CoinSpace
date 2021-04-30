import Velocity from 'velocity-animate';

function animateProfile(el, props, display, context, callback) {
  context.set('animating', true);
  Velocity.animate(el, props, {
    easing: 'ease',
    duration: 300,
    complete() {
      context.set('animating', false);
      if (callback) callback();
    },
    display,
  });
}

export default {
  show(el, context, callback) {
    animateProfile(el, {
      scale: [1.0, 'spring'],
      opacity: 1.0,
    }, 'block', context, callback);
  },
  hide(el, context, callback) {
    animateProfile(el, {
      scale: 0.2,
      opacity: 0,
    }, 'none', context, callback);
  },
};

