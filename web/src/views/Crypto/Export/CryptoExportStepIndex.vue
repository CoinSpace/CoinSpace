<script>
import CsButton from '../../../components/CsButton.vue';
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';
import { walletSeed } from '../../../lib/mixins.js';

import DangerTriangleIcon from '../../../assets/svg/dangerTriangle.svg';

export default {
  components: {
    MainLayout,
    CsButton,
    DangerTriangleIcon,
  },
  extends: CsStep,
  mixins: [walletSeed],
  data() {
    return {
      isLoading: false,
    };
  },
  methods: {
    async show() {
      this.isLoading = true;
      await this.walletSeed(async (walletSeed) => {
        const data = await this.$wallet.getPrivateKey(walletSeed);
        this.updateStorage({ data });
        this.next('show');
      });
      this.isLoading = false;
    },
  },
};
</script>

<template>
  <MainLayout
    :title="$t('Export private keys')"
  >
    <div class="&__container">
      <div
        class="&__warning &__group"
      >
        <div class="&__warning-title">
          <DangerTriangleIcon class="&__danger_triangle" /> {{ $t('Warning!') }}
        </div>
        <div class="&__warning-info">
          <!-- eslint-disable-next-line max-len -->
          {{ $t("Your private keys are keys to your funds so DO NOT SHARE them with anyone unless you'd like them to have access to your funds.") }}
        </div>
      </div>
      <CsButton
        type="primary"
        :isLoading="isLoading"
        @click="show"
      >
        {{ $t('Show') }}
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

    &__warning {
      display: flex;
      flex-direction: column;
      gap: $spacing-md;
    }

    &__warning-title {
      @include text-md;
      @include text-bold;
      display: flex;
      align-items: flex-start;
      color: $danger;
      gap: $spacing-xs;
    }

    &__danger_triangle {
      width: $spacing-xl;
      flex-shrink: 0;
    }

    &__warning-info {
      @include text-md;
      color: $danger;
    }
  }
</style>
