import Ractive from 'lib/ractive';
import template from './index.ract';

export default function({ el, options, value, id }) {
  const ractive = new Ractive({
    el,
    template,
    data: {
      id,
      options,
      getLabel(value) {
        const option = options.find((item) => {
          return item.value === value;
        });
        return option ? option.name : '';
      },
      value,
    },
  });

  ractive.getValue = function() {
    return this.get('value');
  };

  return ractive;
}
