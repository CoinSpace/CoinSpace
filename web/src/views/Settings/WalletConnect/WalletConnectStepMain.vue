<script>
import CsButton from '../../../components/CsButton.vue';
import CsFormGroup from '../../../components/CsForm/CsFormGroup.vue';
import CsFormTextareaReadonly from '../../../components/CsForm/CsFormTextareaReadonly.vue';
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';

import { hexToBytes } from '@noble/hashes/utils';
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
    walletConnect.once('eth_signTypedData', this.signTypedData);
    walletConnect.once('eth_sign', this.signMessage);
    await walletConnect.getPendingSessionRequests();
  },
  async onHide() {
    const walletConnect = await this.$account.walletConnect();
    walletConnect.off('eth_sendTransaction', this.send);
    walletConnect.off('eth_signTypedData', this.signTypedData);
    walletConnect.off('eth_sign', this.signMessage);
  },
  data() {
    return {
      isLoading: false,
      error: undefined,
      isScam: this.storage.session.isScam,
    };
  },
  methods: {
    async disconnect() {
      this.isLoading = true;
      this.error = undefined;
      try {
        const walletConnect = await this.$account.walletConnect();
        await walletConnect.disconnectSession();
      } catch (err) {
        console.error(err);
      } finally {
        this.isLoading = false;
        this.$router.replace({ name: 'settings.walletconnect', force: true });
      }
    },
    async send(request) {
      this.isLoading = true;
      this.error = undefined;
      try {
        const params = request.params.request.params[0];
        const wallet = this.$account.walletByChainId(request.params?.chainId);
        await wallet.cleanup();
        if (![CsWallet.STATE_LOADED, CsWallet.STATE_LOADING].includes(wallet.state)) {
          await wallet.load();
        }
        const amount = new Amount(params.value || 0, wallet.crypto.decimals);
        const gasLimit = params.gas ? BigInt(params.gas) : wallet.gasLimitSmartContract;
        const fee = await wallet.estimateTransactionFee({ amount, address: params.to, gasLimit });
        this.updateStorage({
          method: request.params.request.method,
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
        this.error = this.$account.unknownError();
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    },
    async signTypedData(request) {
      this.isLoading = true;
      this.error = undefined;
      try {
        const wallet = this.$account.walletByChainId(request.params?.chainId);
        await wallet.cleanup();
        if (![CsWallet.STATE_LOADED, CsWallet.STATE_LOADING].includes(wallet.state)) {
          await wallet.load();
        }
        const data = JSON.parse(request.params.request.params[1]);
        this.updateStorage({
          request,
          data,
          method: request.params.request.method,
        });
        this.next('sign');
      } catch (err) {
        this.error = this.$account.unknownError();
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    },
    async signMessage(request) {
      this.isLoading = true;
      this.error = undefined;
      try {
        const wallet = this.$account.walletByChainId(request.params?.chainId);
        await wallet.cleanup();
        if (![CsWallet.STATE_LOADED, CsWallet.STATE_LOADING].includes(wallet.state)) {
          await wallet.load();
        }
        const raw = request.params.request.method === 'personal_sign'
          ? request.params.request.params[0]
          : request.params.request.params[1];
        const data = new TextDecoder().decode(hexToBytes(raw.replace(/^0x/i, '')));
        this.updateStorage({
          request,
          data,
          method: request.params.request.method,
        });
        this.next('sign');
      } catch (err) {
        this.error = this.$account.unknownError();
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
    @back="disconnect"
  >
    <CsFormGroup class="&__container">
      <div>{{ $t('Your wallet is connected to {name}.', { name: storage.session?.peer.metadata.name}) }}</div>
      <CsFormTextareaReadonly
        :value="storage.session?.peer.metadata.url"
        :label="$t('URL')"
        :error="isScam ? $t('This domain is flagged as malicious and potentially harmful.') : false"
      />
    </CsFormGroup>
    <div
      v-if="error"
      class="&__error"
    >
      {{ error }}
    </div>
    <CsButton
      type="danger-light"
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

    &__error {
      @include text-md;
      color: $danger;
    }
  }
</style>
