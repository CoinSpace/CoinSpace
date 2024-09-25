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
    margin-right: calc(-1 * max($spacing-xl, env(safe-area-inset-right)));
    margin-left: calc(-1 * max($spacing-xl, env(safe-area-inset-left)));
    @include breakpoint(lg) {
      margin-right: 0;
      margin-left: 0;
    }

    &__title-wrapper {
      padding:
        0
        max($spacing-xl, env(safe-area-inset-right))
        0
        max($spacing-xl, env(safe-area-inset-left));
      color: $secondary;
      @include breakpoint(lg) {
        padding: 0;
      }
    }

    &__title {
      @include text-sm;
      padding: $spacing-2xs 0;
      border-bottom: 1px solid $divider;
    }

    &__list {
      padding: 0;
      margin: 0;
      list-style: none;
    }
  }
</style>
