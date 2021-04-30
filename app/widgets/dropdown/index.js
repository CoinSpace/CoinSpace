import Ractive from 'lib/ractive';
import template from './index.ract';

export default function(el, options, selectedOption) {
  const ractive = new Ractive({
    el,
    template,
    data: {
      options,
      getLabel(code) {
        const option = options.find((item) => {
          return item.code === code;
        });
        return option ? option.name : '';
      },
      selectedOption,
    },
  });

  ractive.getValue = function() {
    return this.get('selectedOption');
  };

  return ractive;
}
