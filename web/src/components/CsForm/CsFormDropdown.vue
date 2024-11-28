<script>
import CsFormElement from './CsFormElement.vue';
import TrailingIcon from '../../assets/svg/trailing.svg';

export default {
  components: {
    CsFormElement,
    TrailingIcon,
  },
  props: {
    value: {
      type: String,
      default: '',
    },
    label: {
      type: String,
      default: '',
    },
    error: {
      type: [Boolean, String],
      default: false,
    },
    info: {
      type: Boolean,
      default: false,
    },
    writable: {
      type: Boolean,
      default: true,
    },
  },
};
</script>

<template>
  <CsFormElement
    class="&"
    v-bind="$props"
  >
    <div
      v-if="$slots.before"
      class="&__icon-before"
    >
      <slot name="before" />
    </div>
    <div class="&__text">
      {{ value }}
      <input
        class="&__input"
        :class="{
          '&__input--writable': writable,
        }"
        type="text"
        readonly
      >
    </div>
    <div
      v-if="writable"
      class="&__icon-after"
    >
      <TrailingIcon />
    </div>
  </CsFormElement>
</template>

<style lang="scss">
  .#{ $filename } {
    &__text {
      @include ellipsis;
      flex-grow: 1;
    }

    &__input {
      @include transparent-stretch;
      cursor: default;

      &--writable {
        cursor: pointer;
      }
    }

    &__icon-before,
    &__icon-after {
      width: $spacing-xl;
      height: $spacing-xl;
      flex-shrink: 0;
    }
  }
</style>
