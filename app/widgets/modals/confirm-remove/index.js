import Ractive from 'widgets/modals/base';
import content from './_content.ract';

function open(name, remove) {

  const ractive = new Ractive({
    partials: {
      content,
    },
    data: {
      removing: false,
      name,
    },
  });

  ractive.on('remove', function() {
    ractive.set('removing', true);
    remove(this);
  });

  return ractive;
}

export default open;
