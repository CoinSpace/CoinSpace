import Velocity from 'velocity-animate';

function animateDropdown(el, icon, props, options) {

  options.context.set('animating', true);
  const childEl = el.childNodes[0];

  // arrow
  Velocity.animate(icon, props.icon, {
    easing: 'ease',
    duration: 300,
  });

  // container
  Velocity.animate(el, props.container, {
    easing: 'linear',
    duration: 400,
    display: options.display,
  });

  // content
  Velocity.animate(childEl, props.content, {
    easing: 'ease',
    duration: 300,
    delay: options.contentDelay || undefined,
    complete() {
      options.context.set('animating', false);
    },
  });
}

export default {
  show(el, icon, context) {
    const props = {
      icon: { rotateZ: '180deg' },
      container: { maxHeight: '500px' },
      content: { translateY: 0 },
    };
    const options = {
      context,
      display: 'block',
    };
    animateDropdown(el, icon, props, options);
  },
  hide(el, icon, context) {
    const props = {
      icon: { rotateZ: '0deg' },
      container: { maxHeight: '0px' },
      content: { translateY: '-100%' },
    };
    const options = {
      context,
      display: 'none',
      contentDelay: 200,
    };
    animateDropdown(el, icon, props, options);
  },
};

