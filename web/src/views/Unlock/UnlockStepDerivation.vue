<script>
import { CsWallet } from '@coinspace/cs-common';

import AuthStepLayout from '../../layouts/AuthStepLayout.vue';
import CsButton from '../../components/CsButton.vue';
import CsButtonGroup from '../../components/CsButtonGroup.vue';
import CsStep from '../../components/CsStep.vue';

import { walletSeed } from '../../lib/mixins.js';

export default {
  components: {
    AuthStepLayout,
    CsButton,
    CsButtonGroup,
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
      await this.walletSeed(async (walletSeed) => {
        for (const wallet of this.$account.wallets('coin')) {
          if (wallet.state === CsWallet.STATE_NEED_INITIALIZATION) {
            await this.$account.initWallet(wallet, walletSeed);
          }
        }
        this.args.redirect();
      }, { layout: 'AuthStepLayout' });
      this.isLoading = false;
    },
  },
};
</script>

<template>
  <AuthStepLayout :title="$t('Derivation path')">
    <div class="&__description">
      <div>{{ $t('Derivation path was updated.') }}</div>
      <div>{{ $t('Please confirm synchronization with this device.') }}</div>
    </div>

    <CsButtonGroup>
      <CsButton
        type="primary"
        :isLoading="isLoading"
        @click="confirm"
      >
        {{ $t('Confirm') }}
      </CsButton>
    </CsButtonGroup>
  </AuthStepLayout>
</template>

<style lang="scss">
  .#{ $filename } {
    &__description {
      @include text-md;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      gap: $spacing-md;
    }
  }
</style>
