<script>
import CsStep from '../../../components/CsStep.vue';
import CsTransactionConfirm from '../../../components/CsTransactionConfirm.vue';
import MainLayout from '../../../layouts/MainLayout.vue';

import { walletSeed } from '../../../lib/mixins.js';

export default {
  components: {
    MainLayout,
    CsTransactionConfirm,
  },
  extends: CsStep,
  mixins: [walletSeed],
  data() {
    return {
      params: this.storage.request.params.request.params[0],
      isLoading: false,
      error: undefined,
    };
  },
  methods: {
    async confirm() {
      this.isLoading = true;
      const walletConnect = await this.$account.walletConnect();
      await this.walletSeed(async (walletSeed) => {
        try {
          const wallet = this.$account.walletByChainId(this.storage.request.params?.chainId);
          if (!wallet) {
            throw new Error(`Unknown wallet chainId: ${this.storage.request.params?.chainId}`);
          }
          const id = await wallet.eth_sendTransaction(this.params, walletSeed);
          await walletConnect.resolveSessionRequest(this.storage.request, id);
          this.$account.emit('update');
          this.updateStorage({ status: true });
        } catch (err) {
          await walletConnect.rejectSessionRequest(this.storage.request, err);
          // TODO errors
          this.updateStorage({ status: false });
          console.error(err);
        } finally {
          this.replace('status');
        }
      });
    },
  },
};
</script>

<template>
  <MainLayout :title="$t('Confirm transaction')">
    <CsTransactionConfirm
      :transaction="storage.transaction"
      :isLoading="isLoading"
      @confirm="confirm"
    />
  </MainLayout>
</template>
