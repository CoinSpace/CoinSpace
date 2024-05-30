<script>
import CsButton from '../../../components/CsButton.vue';
import CsFormGroup from '../../../components/CsForm/CsFormGroup.vue';
import CsFormTextareaReadonly from '../../../components/CsForm/CsFormTextareaReadonly.vue';
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';

import { walletSeed } from '../../../lib/mixins.js';

export default {
  components: {
    MainLayout,
    CsButton,
    CsFormGroup,
    CsFormTextareaReadonly,
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
          //this.updateStorage({ status: true });
        } catch (err) {
          await walletConnect.rejectSessionRequest(this.storage.request, err);
          // TODO errors
          //this.updateStorage({ status: false });
          console.error(err);
        } finally {
          this.back();
        }
      }, { keepStep: true });
    },
  },
};
</script>

<template>
  <MainLayout
    :title="$t('WalletConnect')"
  >
    <CsFormGroup class="&__container">
      <CsFormTextareaReadonly
        :value="params.to"
        :label="$t('Wallet address')"
      />
      <CsFormTextareaReadonly
        :value="params.data"
        :label="$t('Data')"
      />
      <CsFormTextareaReadonly
        :value="params.value"
        :label="$t('Value')"
      />
    </CsFormGroup>
    <CsButton
      type="primary"
      :isLoading="isLoading"
      @click="confirm"
    >
      {{ $t('Confirm') }}
    </CsButton>
  </MainLayout>
</template>

<style lang="scss">
  .#{ $filename } {
    $self: &;

    &__container {
      flex-grow: 1;
    }
  }
</style>
