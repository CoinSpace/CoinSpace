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
    <slot />
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);

    &--horizontal {
      flex-direction: row;
    }

    &--circle {
      flex-direction: row;
      justify-content: space-around;
      gap: var(--spacing-2xs);
    }
  }
</style>
