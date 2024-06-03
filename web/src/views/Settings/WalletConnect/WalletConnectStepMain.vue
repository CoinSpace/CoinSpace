<script>
import CsButton from '../../../components/CsButton.vue';
import CsFormGroup from '../../../components/CsForm/CsFormGroup.vue';
import CsFormTextareaReadonly from '../../../components/CsForm/CsFormTextareaReadonly.vue';
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';

import { onShowOnHide } from '../../../lib/mixins.js';
import { Amount, CsWallet } from '@coinspace/cs-common';

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
    };
  },
  methods: {
    async disconnect() {
      this.isLoading = true;
      try {
        const walletConnect = await this.$account.walletConnect();
        await walletConnect.disconnectSession();
      } catch (err) {
        console.error(err);
      } finally {
        this.isLoading = false;
        this.$router.up();
      }
    },
    async send(request) {
      this.isLoading = true;
      try {
        const params = request.params.request.params[0];
        const wallet = this.$account.walletByChainId(request.params?.chainId);
        if (![CsWallet.STATE_LOADED, CsWallet.STATE_LOADING].includes(wallet.state)) {
          await wallet.cleanup();
          await wallet.load();
        }
        const amount = new Amount(params.value, wallet.crypto.decimals);
        const gasLimit = params.gas ? BigInt(params.gas) : wallet.gasLimitSmartContract;
        const fee = await wallet.estimateTransactionFee({ amount, address: params.to, gasLimit });
        this.updateStorage({
          request,
          transaction: {
            price: await this.$account.market.getPrice(wallet.crypto._id, this.$currency),
            pricePlatform: await this.$account.market.getPrice(wallet.platform._id, this.$currency),
            amount,
            address: params.to,
            fee,
            crypto: wallet.crypto,
            platform: wallet.platform,
          },
        });
        this.next('confirm');
      } catch (err) {
        console.error(err);
      } finally {
        this.isLoading = false;
      }
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
