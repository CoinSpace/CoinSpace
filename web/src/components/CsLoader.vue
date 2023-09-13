<script>
export default {
  props: {
    type: {
      type: String,
      default: '',
    },
  },
};
</script>

<template>
  <div
    class="&"
    :class="{
      [`&--${type}`]: type,
    }"
  >
    <div class="&__dot" />
    <div class="&__dot" />
    <div class="&__dot" />
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    $self: &;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-xs;

    &__dot {
      width: $spacing-xs;
      height: $spacing-xs;
      border-radius: 50%;
      background-color: $secondary;

      &:nth-child(1) {
        animation: pulse-3 0.4s ease-in-out alternate infinite;
      }

      &:nth-child(2) {
        animation: pulse-3 0.4s ease-in-out alternate 0.2s infinite;
      }

      &:nth-child(3) {
        animation: pulse-3 0.4s ease-in-out alternate 0.4s infinite;
      }
    }

    &--primary {
      #{ $self }__dot {
        background-color: $text-color;
      }
    }

    &--primary-light {
      #{ $self }__dot {
        background-color: $primary;
      }
    }

    &--danger-light {
      #{ $self }__dot {
        background-color: $danger;
      }
    }
  }
</style>
