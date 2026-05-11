<script>
import CsFormElement from './CsFormElement.vue';

export default {
  components: {
    CsFormElement,
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
    rows: {
      type: Number,
      default: 3,
    },
    error: {
      type: [Boolean, String],
      default: false,
    },
  },
  emits: ['update:modelValue'],
  methods: {
    focus() {
      this.$refs.input.focus();
    },
  },
};
</script>

<template>
  <CsFormElement
    class="&"
    v-bind="$props"
  >
    <textarea
      ref="input"
      dir="ltr"
      lang="en"
      :value="modelValue"
      class="&__textarea"
      :rows="rows"
      autocorrect="off"
      autocapitalize="off"
      autocomplete="off"
      spellcheck="false"
      @input="$emit('update:modelValue', $event.target.value.trim())"
    />
  </CsFormElement>
</template>

<style lang="scss">
  .#{ $filename } {
    &__textarea {
      @include text-md;
      flex-grow: 1;
      padding: var(--spacing-sm) 0;
      border: none;
      background-color: transparent;
      color: var(--color-text);
      font-family: inherit;
      line-height: inherit;
      resize: none;

      [dir="rtl"] & {
        text-align: end;
      }
    }
  }
</style>
