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
    gap: var(--spacing-xs);

    &__dot {
      width: var(--spacing-xs);
      height: var(--spacing-xs);
      border-radius: 50%;
      background-color: var(--color-secondary);

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
        background-color: var(--color-text);
      }
    }

    &--primary-light {
      #{ $self }__dot {
        background-color: var(--color-primary);
      }
    }

    &--danger-light {
      #{ $self }__dot {
        background-color: var(--color-danger);
      }
    }
  }
</style>
