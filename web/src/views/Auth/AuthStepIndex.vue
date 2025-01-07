<script>
import CsButton from '../../components/CsButton.vue';
import CsButtonGroup from '../../components/CsButtonGroup.vue';
import CsStep from '../../components/CsStep.vue';
import { onShowOnHide } from '../../lib/mixins.js';

import LogoIcon from '../../assets/svg/logo.svg';

export default {
  components: {
    CsButton,
    CsButtonGroup,
    LogoIcon,
  },
  extends: CsStep,
  mixins: [onShowOnHide],
  computed: {
    copyright() {
      return `© ${new Date().getFullYear()} CoinSpace`;
    },
  },
  async onShow() {
    window.StatusBar?.styleLightContent();
  },
  async onHide() {
    window.StatusBar?.styleDefault();
  },
};
</script>

<template>
  <div class="&">
    <div class="&__frame">
      <div class="&__logo-wrapper">
        <LogoIcon class="&__logo" />
      </div>
      <CsButtonGroup class="&__button-group">
        <CsButton
          type="primary"
          @click="next('passphraseGeneration')"
        >
          {{ $t('Create new wallet') }}
        </CsButton>
        <CsButton
          type="white-link"
          @click="next('login')"
        >
          {{ $t('Open existing wallet') }}
        </CsButton>
      </CsButtonGroup>
    </div>
    <div class="&__copyright">
      {{ copyright }}
    </div>
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    display: flex;
    height: 100%;
    flex-direction: column;
    align-items: center;
    padding:
      $spacing-3xl
      max($spacing-xl, env(safe-area-inset-right))
      $spacing-3xl
      max($spacing-xl, env(safe-area-inset-left));
    background-color: $background-color-dark;
    gap: $spacing-5xl;
    overflow-y: auto;

    &.slide-left-leave-active {
      transition: opacity 0.1s ease-out;
    }

    &.slide-right-enter-active {
      transition: opacity 0.1s ease-in 0.1s;
    }

    &.slide-left-leave-to,
    &.slide-right-enter-from {
      opacity: 0;
    }

    &__frame {
      display: flex;
      width: 100%;
      flex-direction: column;
      flex-grow: 1;
      align-items: center;
      gap: $spacing-5xl;
      @include breakpoint(lg) {
        justify-content: center;
      }
    }

    &__logo-wrapper {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      justify-content: center;
      @include breakpoint(lg) {
        flex-grow: 0;
      }
    }

    &__logo {
      width: 10rem;
    }

    &__button-group {
      width: 100%;
      @include breakpoint(lg) {
        width: auto;
      }
    }

    &__copyright {
      @include text-xs;
      color: $white;
    }
  }
</style>
