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
    inheritDir: {
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
    <div
      class="&__textarea"
      lang="en"
    >
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
    &__textarea {
      @include text-md;
      overflow: hidden;
      flex-grow: 1;
      padding: var(--spacing-sm) 0;
      border: none;
      background-color: transparent;
      color: var(--color-text);
      cursor: auto;
      font-family: inherit;
      line-height: inherit;
      overflow-wrap: break-word;
    }

    &__icon-before,
    &__icon-after {
      width: var(--spacing-xl);
      height: var(--spacing-xl);
      flex-shrink: 0;
    }
  }
</style>
