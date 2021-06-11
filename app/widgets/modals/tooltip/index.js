import Ractive from 'widgets/modals/base';
import content from './content.ract';

export default function showTooltip(data) {

  const ractive = new Ractive({
    el: document.getElementById('tooltip'),
    partials: {
      content,
    },
    data,
  });

  return ractive;
}
