import DesignLayout from '../../layouts/DesignLayout.vue';
import DesignView from '../../views/Design/DesignView.vue';
import DesignViewButtons from '../../views/Design/DesignViewButtons.vue';
import DesignViewCards from '../../views/Design/DesignViewCards.vue';
import DesignViewCryptoLogo from '../../views/Design/DesignViewCryptoLogo.vue';
import DesignViewIcons from '../../views/Design/DesignViewIcons.vue';
import DesignViewInputs from '../../views/Design/DesignViewInputs.vue';
import DesignViewListItems from '../../views/Design/DesignViewListItems.vue';
import DesignViewNumbers from '../../views/Design/DesignViewNumbers.vue';
import DesignViewPullList from '../../views/Design/DesignViewPullList.vue';
import DesignViewTypography from '../../views/Design/DesignViewTypography.vue';

const design = [
  {
    path: '/design',
    component: DesignLayout,
    meta: { dev: true },
    children: [{
      path: '',
      name: 'design',
      component: DesignView,
    }, {
      path: 'buttons',
      name: 'design.buttons',
      component: DesignViewButtons,
    }, {
      path: 'cards',
      name: 'design.cards',
      component: DesignViewCards,
    }, {
      path: 'crypto-logo',
      name: 'design.crypto-logo',
      component: DesignViewCryptoLogo,
    }, {
      path: 'icons',
      name: 'design.icons',
      component: DesignViewIcons,
    }, {
      path: 'inputs',
      name: 'design.inputs',
      component: DesignViewInputs,
    }, {
      path: 'list-items',
      name: 'design.list-items',
      component: DesignViewListItems,
    }, {
      path: 'numbers',
      name: 'design.numbers',
      component: DesignViewNumbers,
    }, {
      path: 'pull-list',
      name: 'design.pull-list',
      component: DesignViewPullList,
    }, {
      path: 'typography',
      name: 'design.typography',
      component: DesignViewTypography,
    }],
  },
];

export default design;
