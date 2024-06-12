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
          const id = await wallet.eth_sendTransaction(params.request.params[0], walletSeed);
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
      this.isLoading = false;
    },
    async reject() {
      this.isLoading = true;
      try {
        const walletConnect = await this.$account.walletConnect();
        await walletConnect.rejectSessionRequest(this.storage.request);
      } catch (err) {
        console.error(err);
      } finally {
        this.isLoading = false;
        this.back();
      }
    },
  },
};
</script>

<template>
  <MainLayout
    :title="$t('Confirm transaction')"
    @back="reject"
  >
    <CsTransactionConfirm
      :transaction="storage.transaction"
      :isLoading="isLoading"
      @confirm="confirm"
    />
  </MainLayout>
</template>
