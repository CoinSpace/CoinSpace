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
          const sign = await wallet.eth_signTypedData(this.storage.data, walletSeed);
          await walletConnect.resolveSessionRequest(this.storage.request, sign);
          this.$account.emit('update');
          this.updateStorage({
            status: true,
            title: this.$t('Signature request'),
            header: this.$t('Signing successful'),
            message: this.$t('Message has been signed.'),
          });
        } catch (err) {
          await walletConnect.rejectSessionRequest(this.storage.request, err);
          this.updateStorage({
            status: false,
            title: this.$t('Signature request'),
            header: this.$t('Signing failed'),
            message: this.$t('Please try again later.'),
          });
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
    :title="$t('Signature request')"
    @back="reject"
  >
    <CsFormGroup class="&__container">
      <div>{{ $t('Sign this message only if you completely understand it.') }}</div>
      <CsFormTextareaReadonly
        :value="JSON.stringify(storage.data)"
        :label="$t('Message')"
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
