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
};
</script>

<template>
  <div
    class="&"
    :class="{ '&--checked': checked }"
    @click="!isLoading && $emit('click')"
  >
    <span class="&__slider" />
  </div>
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
      border-radius: $spacing-lg;
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

    &--checked {
      #{ $self }__slider {
        background-color: $primary-brand;
      }

      #{ $self }__slider::before {
        transform: translateX($spacing-sm);
      }
    }
  }
</style>
