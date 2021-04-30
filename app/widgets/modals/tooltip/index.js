import Ractive from 'widgets/modals/base';
import { translate } from 'lib/i18n';
import content from './content.ract';

export default function showTooltip(data) {

  if (!data.isTranslated) {
    data.message = translate(data.message, data.interpolations);
  }

  const ractive = new Ractive({
    el: document.getElementById('tooltip'),
    partials: {
      content,
    },
    data,
  });

  return ractive;
}
