<script>
import CsButton from '../../../components/CsButton.vue';
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';

import CopyIcon from '../../../assets/svg/copy.svg';

export default {
  components: {
    MainLayout,
    CsButton,
    CopyIcon,
  },
  extends: CsStep,
  data() {
    return {
      isCopied: false,
    };
  },
  methods: {
    copyToClipboard() {
      navigator.clipboard.writeText(JSON.stringify(this.storage.data, null, 2)).then(() => {
        this.isCopied = true;
        setTimeout(() => {
          this.isCopied = false;
        }, 1000);
      }, () => {});
    },
  },
};
</script>

<template>
  <MainLayout
    :title="$t('Export private keys')"
  >
    <div
      v-if="storage.data.length === 0"
      class="&__empty"
    >
      {{ $t('Your wallet has no private keys with coins for export.') }}
    </div>

    <div
      v-if="storage.data.length !== 0"
      class="&__container"
    >
      <div
        class="&__keys &__group"
      >
        <div
          v-for="(item, index) in storage.data"
          :key="index"
          class="&__data"
        >
          <div
            v-if="item.address"
            class="&__item"
          >
            <div class="&__item-title">
              {{ $t('Public address') }}
            </div>
            <div class="&__item-subtitle">
              {{ item.address }}
            </div>
          </div>
          <div
            v-if="item.privatekey"
            class="&__item"
          >
            <div class="&__item-title">
              {{ $t('Private key') }}
            </div>
            <div class="&__item-subtitle">
              {{ item.privatekey }}
            </div>
          </div>
          <div
            v-if="item.ownerPublicKey"
            class="&__item"
          >
            <div class="&__item-title">
              {{ $t('Owner public key') }}
            </div>
            <div class="&__item-subtitle">
              {{ item.ownerPublicKey }}
            </div>
          </div>
          <div
            v-if="item.ownerPrivateKey"
            class="&__item"
          >
            <div class="&__item-title">
              {{ $t('Owner private key') }}
            </div>
            <div class="&__item-subtitle">
              {{ item.ownerPrivateKey }}
            </div>
          </div>
          <div
            v-if="item.activePublicKey"
            class="&__item"
          >
            <div class="&__item-title">
              {{ $t('Active public key') }}
            </div>
            <div class="&__item-subtitle">
              {{ item.activePublicKey }}
            </div>
          </div>
          <div
            v-if="item.activePrivateKey"
            class="&__item"
          >
            <div class="&__item-title">
              {{ $t('Active private key') }}
            </div>
            <div class="&__item-subtitle">
              {{ item.activePrivateKey }}
            </div>
          </div>
          <div
            v-if="item.secret"
            class="&__item"
          >
            <div class="&__item-title">
              {{ $t('Secret') }}
            </div>
            <div class="&__item-subtitle">
              {{ item.secret }}
            </div>
          </div>
          <div
            v-if="item.publicviewkey"
            class="&__item"
          >
            <div class="&__item-title">
              {{ $t('Public view key') }}
            </div>
            <div class="&__item-subtitle">
              {{ item.publicviewkey }}
            </div>
          </div>
          <div
            v-if="item.privateviewkey"
            class="&__item"
          >
            <div class="&__item-title">
              {{ $t('Private view key') }}
            </div>
            <div class="&__item-subtitle">
              {{ item.privateviewkey }}
            </div>
          </div>
          <div
            v-if="item.publicspendkey"
            class="&__item"
          >
            <div class="&__item-title">
              {{ $t('Public spend key') }}
            </div>
            <div class="&__item-subtitle">
              {{ item.publicspendkey }}
            </div>
          </div>
          <div
            v-if="item.privatespendkey"
            class="&__item"
          >
            <div class="&__item-title">
              {{ $t('Private spend key') }}
            </div>
            <div class="&__item-subtitle">
              {{ item.privatespendkey }}
            </div>
          </div>
        </div>
      </div>
      <CsButton
        type="primary-link"
        @click="copyToClipboard"
      >
        <CopyIcon class="&__copy-icon" />
        {{ isCopied ? $t('Copied!') : $t('Copy') }}
      </CsButton>
    </div>
  </MainLayout>
</template>

<style lang="scss">
  .#{ $filename } {
    $self: &;

    &__container {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      gap: $spacing-3xl;
    }

    &__group {
      &:last-of-type {
        flex-grow: 1;
      }
    }

    &__empty {
      @include text-md;
    }

    &__keys {
      display: flex;
      flex-direction: column;
      gap: $spacing-3xl;
    }

    &__data {
      display: flex;
      flex-direction: column;
      gap: $spacing-lg;
    }

    &__item {
      display: flex;
      flex-direction: column;
      gap: $spacing-2xs;
    }

    &__item-title {
      @include text-md;
      @include text-bold;
    }

    &__item-subtitle {
      @include text-sm;
      word-break: break-all;
    }
  }
</style>
