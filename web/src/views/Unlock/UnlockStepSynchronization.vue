<script>
import AuthStepLayout from '../../layouts/AuthStepLayout.vue';
import CsButton from '../../components/CsButton.vue';
import CsButtonGroup from '../../components/CsButtonGroup.vue';
import CsStep from '../../components/CsStep.vue';

import { redirectToApp, walletSeed } from '../../lib/mixins.js';

export default {
  components: {
    AuthStepLayout,
    CsButton,
    CsButtonGroup,
  },
  extends: CsStep,
  mixins: [redirectToApp, walletSeed],
  data() {
    return {
      isLoading: false,
    };
  },
  methods: {
    async confirm() {
      this.isLoading = true;
      await this.walletSeed(async (walletSeed) => {
        await this.$account.initWallets(this.$account.walletsNeedSynchronization, walletSeed);

        this.done();
      }, { layout: 'AuthStepLayout' });
      this.isLoading = false;
    },
    done() {
      if (this.$account.cryptosToSelect) {
        this.next('selectCryptos');
      } else {
        this.redirectToApp();
      }
    },
  },
};
</script>

<template>
  <AuthStepLayout :title="$t('Synchronization')">
    <div class="&__description">
      <div>{{ $t('Wallet settings have been updated.') }}</div>
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
