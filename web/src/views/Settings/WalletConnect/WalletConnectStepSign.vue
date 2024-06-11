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
  computed: {
    message() {
      return ['eth_signTypedData', 'eth_signTypedData_v4'].includes(this.storage.method)
        ? JSON.stringify(this.storage.data)
        : this.storage.data;
    },
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
          const data = this.storage.method === 'personal_sign'
            ? params.request.params[0]
            : params.request.params[1];
          const sign = ['eth_signTypedData', 'eth_signTypedData_v4'].includes(this.storage.method)
            ? await wallet.eth_signTypedData(data, walletSeed)
            : await wallet.eth_sign(data, walletSeed);
          await walletConnect.resolveSessionRequest(this.storage.request, sign);
          this.$account.emit('update');
          this.updateStorage({ status: true });
        } catch (err) {
          await walletConnect.rejectSessionRequest(this.storage.request, err);
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
    :title="$t('Signature request')"
    @back="reject"
  >
    <CsFormGroup class="&__container">
      <div>{{ $t('Sign this message only if you completely understand it.') }}</div>
      <CsFormTextareaReadonly
        :value="message"
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

<style lang="scss">
  .#{ $filename } {
    $self: &;

    &__container {
      flex-grow: 1;
    }
  }
</style>
