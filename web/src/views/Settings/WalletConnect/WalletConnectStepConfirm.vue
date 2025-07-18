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
      isLoading: false,
    };
  },
  methods: {
    async confirm() {
      this.isLoading = true;
      const walletConnect = await this.$account.walletConnect();
      await this.walletSeed(async (walletSeed) => {
        try {
          const { params } = this.storage.request;
          const wallet = this.$account.walletByChainId(params?.chainId);
          if (!wallet) {
            throw new Error(`Unknown wallet chainId: ${params?.chainId}`);
          }
          const id = await wallet.eth_sendTransaction({
            ...params.request.params[0],
            gas: this.storage.gasLimit,
          }, walletSeed);
          await walletConnect.resolveSessionRequest(this.storage.request, id);
          this.$account.emit('update');
          this.updateStorage({ status: true });
        } catch (err) {
          await walletConnect.rejectSessionRequest(this.storage.request, err);
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
  <MainLayout
    :title="$t('Confirm transaction')"
  >
    <CsTransactionConfirm
      :transaction="storage.transaction"
      :isLoading="isLoading"
      @confirm="confirm"
    />
  </MainLayout>
</template>
