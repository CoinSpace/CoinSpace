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
        this.internalValue = value.replace(/[^0-9]+/g, '');
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
      if (!modelValue) {
        this.internalValue = '0';
      } else {
        const value = BigInt(this.internalValue);
        if (modelValue !== value) {
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
