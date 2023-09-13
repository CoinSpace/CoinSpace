<script>
import CsFormElement from './CsFormElement.vue';

export default {
  components: {
    CsFormElement,
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
      type: [Boolean, String],
      default: false,
    },
    writable: {
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
    </div>
    <div
      v-if="$slots.after"
      class="&__icon-after"
    >
      <slot name="after" />
    </div>
    <template #info>
      <slot name="info" />
    </template>
    <template
      v-if="$slots.infoFooter"
      #infoFooter
    >
      <slot name="infoFooter" />
    </template>
  </CsFormElement>
</template>

<style lang="scss">
  .#{ $filename } {
    &__text {
      @include ellipsis;
      flex-grow: 1;
      cursor: auto;
    }

    &__icon-before,
    &__icon-after {
      width: $spacing-xl;
      height: $spacing-xl;
      flex-shrink: 0;
    }
  }
</style>
