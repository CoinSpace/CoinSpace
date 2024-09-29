<script>
export default {
  props: {
    checked: {
      type: Boolean,
      default: false,
    },
    isLoading: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['click'],
  methods: {
    click() {
      // https://github.com/vuejs/core/issues/12070
      setTimeout(() => {
        if (!this.isLoading) {
          this.$emit('click');
        }
      }, 1);
    },
  },
};
</script>

<template>
  <label
    class="&"
  >
    <input
      ref="input"
      :checked="checked"
      type="checkbox"
      role="switch"
      class="&__slider"
      @click.prevent="click"
    >
  </label>
</template>

<style lang="scss">
  .#{ $filename } {
    $self: &;

    position: relative;
    display: block;
    width: $spacing-2xl;
    height: $spacing-lg;
    cursor: pointer;

    &__slider {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border-radius: $spacing-lg;
      margin: 0;
      appearance: none;
      background-color: $gray;
      transition: all 0.1s ease-out;

      &::before {
        position: absolute;
        bottom: $spacing-3xs;
        left: $spacing-3xs;
        width: $spacing-md;
        height: $spacing-md;
        border-radius: 50%;
        background-color: $white;
        content: "";
        transition: all 0.1s ease-out;
      }
    }

    &__slider:checked {
      background-color: $primary-brand;

      &::before {
        transform: translateX($spacing-sm);
      }
    }
  }
</style>
