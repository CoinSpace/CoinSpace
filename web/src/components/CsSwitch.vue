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
          window.taptic?.tap();
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
    width: var(--spacing-2xl);
    height: var(--spacing-lg);
    cursor: pointer;

    &__slider {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border-radius: var(--spacing-lg);
      margin: 0;
      appearance: none;
      background-color: var(--color-neutral);
      transition: all 0.1s ease-out;

      &::before {
        position: absolute;
        bottom: var(--spacing-3xs);
        left: var(--spacing-3xs);
        width: var(--spacing-md);
        height: var(--spacing-md);
        border-radius: 50%;
        background-color: var(--color-white);
        content: "";
        transition: all 0.1s ease-out;

        [dir="rtl"] & {
          transform: translateX(var(--spacing-sm));
        }
      }
    }

    &__slider:checked {
      background-color: var(--color-primary-brand);

      &::before {
        transform: translateX(var(--spacing-sm));

        [dir="rtl"] & {
          transform: translateX(0);
        }
      }
    }
  }
</style>
