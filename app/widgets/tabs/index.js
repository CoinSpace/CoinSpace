import Ractive from 'lib/ractive';
import emitter from 'lib/emitter';
import template from './index.ract';

export default function(el) {
  const ractive = new Ractive({
    el,
    template,
  });

  const tabElements = {
    send: '#send_tab',
    receive: '#receive_tab',
    exchange: '#exchange_tab',
    history: '#history_tab',
    tokens: '#tokens_tab',
  };
  let active;
  function highlightTab(node) {
    if (node !== active && active && active.classList.contains('active')) {
      active.classList.remove('active');
    }
    node.classList.add('active');
    active = node;
  }

  highlightTab(ractive.find(tabElements.send));

  emitter.on('change-tab', (tab) => {
    highlightTab(ractive.find(tabElements[tab]));
  });

  ractive.on('select', (context)=> {
    context.original.preventDefault();
    emitter.emit('change-tab', context.node.dataset.tab);
    highlightTab(context.node);
  });

  return ractive;
}
