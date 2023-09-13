<script>
import { Amount } from '@coinspace/cs-common';

export default {
  props: {
    modelValue: {
      type: Amount,
      default: undefined,
    },
    decimals: {
      type: Number,
      required: true,
    },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      // initial value from modelValue
      internalValue: this.modelValue ? this.modelValue.toString() : '',
    };
  },
  computed: {
    inputValue: {
      get() {
        return this.internalValue;
      },
      set(value) {
        const [integer, fraction] = value
          .replace(/,/g, '.')
          .replace(/[^0-9.]+/g, '')
          .split('.');
        if (fraction === undefined) {
          this.internalValue = integer;
        } else if (fraction.length === 0) {
          this.internalValue = `${integer}.`;
        } else if (fraction.length <= this.decimals) {
          this.internalValue = `${integer}.${fraction}`;
        } else {
          this.internalValue = `${integer}.${fraction.slice(0, this.decimals)}`;
        }
        if (value !== this.internalValue) {
          this.$forceUpdate();
        }
      },
    },
  },
  watch: {
    internalValue(internalValue) {
      const amount = Amount.fromString(internalValue, this.decimals);
      if (!this.modelValue || this.modelValue.value !== amount.value) {
        this.$emit('update:modelValue', amount);
      }
    },
    modelValue(modelValue) {
      if (!modelValue) {
        this.internalValue = '0';
      } else {
        const amount = Amount.fromString(this.internalValue, this.decimals);
        if ((modelValue.value !== amount.value) || this.internalValue === '') {
          this.internalValue = modelValue.toString();
        }
      }

    },
  },
};
</script>

<template>
  <input
    v-model="inputValue"
    type="text"
    inputmode="decimal"
    autocorrect="off"
    autocapitalize="off"
    autocomplete="off"
    spellcheck="false"
    lang="en"
    class="&"
  >
</template>

<style lang="scss">
  .#{ $filename } {
    width: 100%;
    border: none;
  }
</style>
