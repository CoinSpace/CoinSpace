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
      internalValue: this.modelValue?.toString(),
      lastEmittedValue: this.modelValue?.value,
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
          if (integer === '') {
            this.internalValue = undefined;
          } else {
            this.internalValue = BigInt(integer || '0').toString(10);
          }
        } else {
          this.internalValue = `${BigInt(integer || '0').toString(10)}.${fraction.slice(0, this.decimals)}`;
        }
        if (value !== this.internalValue) {
          this.$forceUpdate();
        }
      },
    },
  },
  watch: {
    internalValue(internalValue) {
      const amount = internalValue !== undefined ? Amount.fromString(internalValue, this.decimals) : undefined;
      if (this.modelValue?.value !== amount?.value) {
        this.lastEmittedValue = amount?.value;
        this.$emit('update:modelValue', amount);
      }
    },
    modelValue(modelValue) {
      const incoming = modelValue?.value;
      if (incoming === this.lastEmittedValue) return;
      this.lastEmittedValue = incoming;
      this.internalValue = modelValue?.toString();
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
    dir="ltr"
    lang="en"
    class="&"
  >
</template>

<style lang="scss">
  .#{ $filename } {
    width: 100%;
    border: none;

    [dir="rtl"] & {
      text-align: end;
    }
  }
</style>
