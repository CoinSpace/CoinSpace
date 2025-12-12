<script>
export default {
  props: {
    modelValue: {
      type: BigInt,
      default: undefined,
    },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      internalValue: this.modelValue ? this.modelValue.toString() : '',
    };
  },
  computed: {
    inputValue: {
      get() {
        return this.internalValue;
      },
      set(value) {
        const integer = value.replace(/[^0-9]+/g, '');
        if (integer === '') {
          this.internalValue = '';
        } else {
          this.internalValue = BigInt(integer || '0').toString(10);
        }
        if (value !== this.internalValue) {
          this.$forceUpdate();
        }
      },
    },
  },
  watch: {
    internalValue(internalValue) {
      const value = BigInt(internalValue);
      if (!this.modelValue || this.modelValue !== value) {
        this.$emit('update:modelValue', value);
      }
    },
    modelValue(modelValue) {
      if (modelValue === undefined) {
        this.internalValue = '0';
      } else {
        if (modelValue !== BigInt(this.internalValue)) {
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
    inputmode="numeric"
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
