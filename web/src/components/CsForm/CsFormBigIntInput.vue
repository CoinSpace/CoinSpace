<script>
import CsBigIntInput from '../CsBigIntInput.vue';
import CsFormElement from './CsFormElement.vue';

export default {
  components: {
    CsBigIntInput,
    CsFormElement,
  },
  props: {
    modelValue: {
      type: BigInt,
      default: undefined,
    },
    label: {
      type: String,
      default: undefined,
    },
    error: {
      type: [Boolean, String],
      default: false,
    },
    small: {
      type: Boolean,
      default: false,
    },
    info: {
      type: [Boolean, String],
      default: false,
    },
  },
  emits: ['update:modelValue'],
  computed: {
    inputValue: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      },
    },
  },
};
</script>

<template>
  <CsFormElement
    class="&"
    :label="label"
    :error="error"
    :small="small"
    :info="info"
  >
    <CsBigIntInput
      v-model="inputValue"
      class="&__amount"
    />
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
    &__amount {
      @include ellipsis;
      flex-grow: 1;
    }
  }
</style>
