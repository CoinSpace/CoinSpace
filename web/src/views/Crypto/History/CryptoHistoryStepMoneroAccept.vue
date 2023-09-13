<script>
import CsLoader from '../../../components/CsLoader.vue';
import CsStep from '../../../components/CsStep.vue';
import { CsWallet } from '@coinspace/cs-common';
import MainLayout from '../../../layouts/MainLayout.vue';

import { onShowOnHide } from '../../../lib/mixins.js';
import { walletSeed } from '../../../lib/mixins.js';

export default {
  components: {
    CsLoader,
    MainLayout,
  },
  extends: CsStep,
  mixins: [walletSeed, onShowOnHide],
  async onShow() {
    this.isLoading = true;
    try {
      const wallet = this.$account.wallet('monero@monero');
      if (![CsWallet.STATE_LOADED, CsWallet.STATE_LOADING].includes(wallet.state)) {
        await wallet.cleanup();
        await wallet.load();
      }
      const txId = this.storage.payoutHash;
      await wallet.validateTransaction(txId);
      this.error = false;
      await this.walletSeed(async (walletSeed) => {
        try {
          await wallet.addTransaction(txId, walletSeed);
          this.$account.emit('update');
          this.updateStorage({ status: true });
        } catch (err) {
          this.updateStorage({ status: false, error: err });
        }
        this.next('moneroStatus');
      });
    } catch (err) {
      this.updateStorage({ status: false, error: err });
      this.next('moneroStatus');
      console.error(err);
    } finally {
      this.isLoading = false;
    }
  },
  data() {
    return {
      isLoading: false,
    };
  },
};
</script>

<template>
  <MainLayout :title="$t('Accept transaction')">
    <CsLoader v-if="isLoading" />
  </MainLayout>
</template>

<style lang="scss">
  .#{ $filename } {
    $self: &;

    &__container {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      align-items: center;
      justify-content: center;
    }

    &__icon {
      width: $spacing-9xl;
      height: $spacing-9xl;
    }

    &__info {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: $spacing-2xs;
    }

    &__title {
      @include text-md;
      @include text-bold;
    }

    &__subtitle {
      @include text-sm;
    }
  }
</style>
