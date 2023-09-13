<script>
import CsFormElement from './CsFormElement.vue';

import TrailingIcon from '../../assets/svg/trailing.svg';

export default {
  components: {
    CsFormElement,
    TrailingIcon,
  },
  props: {
    modelValue: {
      type: [String, Number],
      default: '',
    },
    options: {
      type: Array,
      required: true,
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
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue'],
  computed: {
    value() {
      const option = this.options.find((item) => {
        return item.value === this.modelValue;
      });
      return option ? option.name : '';
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
    <div class="&__value">
      {{ value }}
    </div>
    <select
      class="&__select"
      :value="modelValue"
      @change="$emit('update:modelValue', $event.target.value)"
    >
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.name }}
      </option>
    </select>
    <div
      v-if="$slots.after"
      class="&__icon-after"
    >
      <slot name="after" />
    </div>
    <div
      class="&__icon-after"
    >
      <TrailingIcon />
    </div>
  </CsFormElement>
</template>

<style lang="scss">
  .#{ $filename } {
    &__value {
      @include ellipsis;
      flex-grow: 1;
    }

    &__select {
      @include text-md;
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
