<script>
import CsFormElement from './CsFormElement.vue';

import CloseIcon from '../../assets/svg/close.svg';

export default {
  components: {
    CsFormElement,
    CloseIcon,
  },
  props: {
    modelValue: {
      type: String,
      default: '',
    },
    label: {
      type: String,
      default: undefined,
    },
    error: {
      type: [Boolean, String],
      default: false,
    },
    placeholder: {
      type: String,
      default: '',
    },
    small: {
      type: Boolean,
      default: false,
    },
    clear: {
      type: Boolean,
      default: false,
    },
    info: {
      type: [Boolean, String],
      default: false,
    },
  },
  emits: ['update:modelValue'],
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
    <input
      :value="modelValue"
      type="text"
      lang="en"
      class="&__input"
      autocorrect="off"
      autocapitalize="off"
      autocomplete="off"
      spellcheck="false"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', $event.target.value.trim())"
    >
    <div
      v-if="$slots.after"
      class="&__icon-after"
    >
      <slot name="after" />
    </div>
    <div
      v-if="clear && modelValue"
      class="&__icon-after"
      role="button"
      :title="$t('Clear')"
      :aria-label="$t('Clear')"
      @click="$emit('update:modelValue', '')"
    >
      <CloseIcon />
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
    <template
      v-if="$slots.button"
      #button
    >
      <slot name="button" />
    </template>
  </CsFormElement>
</template>

<style lang="scss">
  .#{ $filename } {
    &__input {
      @include ellipsis;
      width: 100%;
      flex-grow: 1;

      &::placeholder {
        color: $secondary;
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
