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
    info: {
      type: Boolean,
      default: false,
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
        type="text"
        readonly
      >
    </div>
    <div class="&__icon-after">
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
    }

    &__icon-before,
    &__icon-after {
      width: $spacing-xl;
      height: $spacing-xl;
      flex-shrink: 0;
    }
  }
</style>
