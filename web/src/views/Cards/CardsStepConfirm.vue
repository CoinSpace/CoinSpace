<script>
import CsStep from '../../components/CsStep.vue';
import CsTransactionConfirm from '../../components/CsTransactionConfirm.vue';
import MainLayout from '../../layouts/MainLayout.vue';

import { walletSeed } from '../../lib/mixins.js';

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
  computed: {
    title() {
      if (this.storage.cardAction === 'topup') {
        return this.$t('Confirm top-up');
      }
      if (this.storage.cardAction === 'buy') {
        return this.$t('Confirm transaction');
      }
    },
  },
  methods: {
    async confirm() {
      this.isLoading = true;
      await this.walletSeed(async (walletSeed) => {
        try {
          if (['topup', 'buy'].includes(this.storage.cardAction)) {
            const wallet = this.$account.wallet(this.storage.crypto._id);
            const { id, broadcast } = await wallet.buildTransaction({
              address: this.storage.address,
              amount: this.storage.amount,
              feeRate: this.storage.feeRate,
              gasLimit: this.storage.gasLimit,
              price: this.storage.priceUSD,
            }, walletSeed);

            if (this.storage.cardAction === 'topup') {
              await this.$account.cards.topup(this.storage.card.id, id, this.storage.crypto._id);
            }
            if (this.storage.cardAction === 'buy') {
              await this.$account.cards.buy(this.storage.product.id, id, this.storage.crypto._id);
            }
            await broadcast();
            this.$account.emit('update');
          }
          this.updateStorage({ status: true });
        } catch (err) {
          this.updateStorage({ status: false, error: err });
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
  <MainLayout :title="title">
    <CsTransactionConfirm
      :transaction="storage"
      :isLoading="isLoading"
      @confirm="confirm"
    />
  </MainLayout>
</template>
