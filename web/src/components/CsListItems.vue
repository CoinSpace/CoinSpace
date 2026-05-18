<script>
export default {
  props: {
    title: {
      type: String,
      default: '',
    },
  },
};
</script>

<template>
  <div class="&">
    <div
      v-if="title"
      class="&__title-wrapper"
    >
      <div class="&__title">
        {{ title }}
      </div>
    </div>
    <ul class="&__list">
      <slot />
    </ul>
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    margin-right: calc(-1 * var(--spacing-xl));
    margin-left: calc(-1 * var(--spacing-xl));
    @include breakpoint(lg) {
      margin-right: 0;
      margin-left: 0;
    }

    &__title-wrapper {
      padding:
        0
        var(--spacing-xl)
        0
        var(--spacing-xl);
      color: var(--color-secondary);
      @include breakpoint(lg) {
        padding: 0;
      }
    }

    &__title {
      @include text-sm;
      padding: var(--spacing-2xs) 0;
      border-bottom: 1px solid var(--color-divider);
    }

    &__list {
      padding: 0;
      margin: 0;
      list-style: none;
    }
  }
</style>
