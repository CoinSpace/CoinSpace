<script>
import CsStep from '../../components/CsStep.vue';

import { onShowOnHide, walletSeed } from '../../lib/mixins.js';

export default {
  extends: CsStep,
  mixins: [onShowOnHide, walletSeed],
  data() {
    return {
      isLoading: true,
      askedForSeed: false,
    };
  },
  render() {
    return null;
  },
  async onShow() {
    if (!this.$account.cards.isLocked) {
      return this.replace('list');
    }
    if (this.askedForSeed) {
      return this.back();
    }
    this.askedForSeed = true;
    await this.walletSeed(async (walletSeed) => {
      await this.$account.cards.initSeed(walletSeed);
      this.replace('list');
    });
  },
};
</script>
