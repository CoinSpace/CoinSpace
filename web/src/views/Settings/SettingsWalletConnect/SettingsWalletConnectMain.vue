<script>
import CsButton from '../../../components/CsButton.vue';
import CsFormGroup from '../../../components/CsForm/CsFormGroup.vue';
import CsFormTextareaReadonly from '../../../components/CsForm/CsFormTextareaReadonly.vue';
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';

import { onShowOnHide } from '../../../lib/mixins.js';

export default {
  components: {
    MainLayout,
    CsButton,
    CsFormGroup,
    CsFormTextareaReadonly,
  },
  extends: CsStep,
  mixins: [onShowOnHide],
  async onShow() {
    const walletConnect = await this.$account.walletConnect();
    walletConnect.once('eth_sendTransaction', this.send);
  },
  async onHide() {
    const walletConnect = await this.$account.walletConnect();
    walletConnect.off('eth_sendTransaction', this.send);
  },
  data() {
    return {
      isLoading: false,
      error: undefined,
    };
  },
  methods: {
    async disconnect() {
      this.isLoading = true;
      try {
        const walletConnect = await this.$account.walletConnect();
        await walletConnect.disconnectSession();
        this.$router.up();
      } catch (err) {
        // TODO errors
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    },
    send(request) {
      this.updateStorage({ request });
      this.next('confirm');
    },
  },
};
</script>

<template>
  <MainLayout
    :title="$t('WalletConnect')"
  >
    <CsFormGroup class="&__container">
      <div>{{ $t('Your wallet is connected to {name}', { name: storage.session?.peer.metadata.name}) }}</div>
      <CsFormTextareaReadonly
        :value="storage.session?.peer.metadata.url"
        :label="$t('URL')"
      />
    </CsFormGroup>
    <CsButton
      type="primary"
      :isLoading="isLoading"
      @click="disconnect"
    >
      {{ $t('Disconnect') }}
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
