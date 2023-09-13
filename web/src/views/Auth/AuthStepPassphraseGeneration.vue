<script>
import { wordlist } from '@scure/bip39/wordlists/english';
import { generateMnemonic, mnemonicToSeed } from '@scure/bip39';

import AuthStepLayout from '../../layouts/AuthStepLayout.vue';
import CsButton from '../../components/CsButton.vue';
import CsStep from '../../components/CsStep.vue';

import WalletGradientIcon from '../../assets/svg/walletGradient.svg';

export default {
  components: {
    CsButton,
    AuthStepLayout,
    WalletGradientIcon,
  },
  extends: CsStep,
  methods: {
    async generate() {
      const passphrase = generateMnemonic(wordlist, 128);
      const seed = await mnemonicToSeed(passphrase);
      this.updateStorage({ passphrase, seed });
      this.next('passphrase');
    },
  },
};
</script>

<template>
  <AuthStepLayout :title="$t('New wallet')">
    <div class="&__wallet">
      <WalletGradientIcon class="&__wallet-icon" />
    </div>
    <div class="&__container">
      <div class="&__header">
        {{ $t('We are about to generate your very own passphrase') }}
      </div>
      <div class="&__text">
        {{ $t('This allows you to open your wallet on multiple devices and keeps it secure.') }}
      </div>
      <div class="&__text">
        {{ $t('It is very important to write down the passphrase.') }}
      </div>
    </div>
    <CsButton
      class="&__generate"
      type="primary"
      @click="generate"
    >
      {{ $t('Generate passphrase') }}
    </CsButton>
  </AuthStepLayout>
</template>

<style lang="scss">
  .#{ $filename } {
    &__wallet {
      display: flex;
      flex-grow: 1;
      justify-content: center;
      @include breakpoint(lg) {
        flex-grow: 0;
        justify-content: flex-start;
      }
    }

    &__wallet-icon {
      width: $spacing-8xl;
      @include breakpoint(lg) {
        width: $spacing-4xl;
      }
    }

    &__container {
      display: flex;
      flex-direction: column;
      gap: $spacing-md;
      @include breakpoint(lg) {
        flex-grow: 1;
      }
    }

    &__header {
      @include text-lg;
      @include text-bold;
    }

    &__text {
      @include text-md;
    }

    &__generate {
      flex-shrink: 0;
    }
  }
</style>
