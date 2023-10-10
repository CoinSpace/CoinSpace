<script>
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';

import CsTransactionConfirm from '../../../components/CsTransactionConfirm.vue';

export default {
  components: {
    MainLayout,
    CsTransactionConfirm,
  },
  extends: CsStep,
  data() {
    return {
      isLoading: false,
    };
  },
  methods: {
    async confirm() {
      this.isLoading = true;
      try {
        await this.$wallet.createImport({
          privateKey: this.storage.privateKey,
          feeRate: this.storage.feeRate,
          price: this.storage.priceUSD,
        });
        this.$account.emit('update');
        this.updateStorage({ status: true });
      } catch (err) {
        console.error(err);
        this.updateStorage({ status: false });
      }
      this.isLoading = false;
      this.next('status');
    },
  },
};
</script>

<template>
  <MainLayout :title="$t('Confirm transaction')">
    <CsTransactionConfirm
      :transaction="storage"
      :isLoading="isLoading"
      @confirm="confirm"
    />
  </MainLayout>
</template>
