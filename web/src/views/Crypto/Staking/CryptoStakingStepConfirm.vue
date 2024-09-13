<script>
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';
import { walletSeed } from '../../../lib/mixins.js';

import CsTransactionConfirm from '../../../components/CsTransactionConfirm.vue';

export default {
  components: {
    MainLayout,
    CsTransactionConfirm,
  },
  extends: CsStep,
  mixins: [walletSeed],
  data() {
    return {
      isLoading: false,
    };
  },
  methods: {
    async confirm() {
      this.isLoading = true;
      await this.walletSeed(async (walletSeed) => {
        try {
          const options = {
            amount: this.storage.amount,
            price: this.storage.priceUSD,
          };
          if (this.storage.method === 'stake') {
            await this.$wallet.stake(options, walletSeed);
          } else if (this.storage.method === 'unstake') {
            await this.$wallet.unstake(options, walletSeed);
          } else if (this.storage.method === 'claim') {
            await this.$wallet.claim(walletSeed);
          }
          this.$account.emit('update');
          this.updateStorage({ status: true });
        } catch (err) {
          this.updateStorage({ status: false });
          console.error(err);
        } finally {
          this.next('status');
        }
      });
      this.isLoading = false;
    },
  },
};
</script>

<template>
  <MainLayout :title="storage.title">
    <CsTransactionConfirm
      :transaction="storage"
      :isLoading="isLoading"
      @confirm="confirm"
    />
  </MainLayout>
</template>
