<script>
import CsNavbarButton from './CsNavbarButton.vue';

import ArrowLeftIcon from '../assets/svg/arrowLeft.svg';

export default {
  components: {
    CsNavbarButton,
    ArrowLeftIcon,
  },
  props: {
    title: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    showBack: {
      type: Boolean,
      default: true,
    },
    centered: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['back'],
};
</script>

<template>
  <div class="&">
    <div class="&__action">
      <slot
        v-if="$slots.left"
        name="left"
      />
      <CsNavbarButton
        v-else-if="showBack"
        @click="$emit('back')"
      >
        <ArrowLeftIcon />
      </CsNavbarButton>
    </div>
    <div
      class="&__content"
      :class="{'&__content--centered': centered}"
    >
      <div class="&__title">
        {{ title }}
      </div>
      <div class="&__description">
        {{ description }}
      </div>
    </div>
    <div class="&__action">
      <slot name="right" />
    </div>
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    display: flex;
    width: 100%;
    height: $spacing-5xl;
    flex-direction: row;
    align-items: center;

    &__action {
      display: flex;
      height: 100%;
      flex-basis: $spacing-5xl;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
    }

    &__content {
      min-width: 20%;
      flex-grow: 1;
      text-align: center;
      @include breakpoint(lg) {
        text-align: left;
      }

      &--centered {
        @include breakpoint(lg) {
          text-align: center;
        }
      }
    }

    &__title {
      @include text-md;
      @include text-bold;
      @include ellipsis;
    }

    &__description {
      @include text-sm;
      @include ellipsis;
    }
  }
</style>
