import Ractive from 'widgets/modals/base';
import content from './content.ract';

function open({ confirmUpdate }) {
  const ractive = new Ractive({
    append: true,
    partials: {
      content,
    },
    data: {},
  });

  ractive.on('skip', () => {
    ractive.fire('close');
  });

  ractive.on('confirm', confirmUpdate);

  return ractive;
}

export default open;
