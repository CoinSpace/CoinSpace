<script>
export default {
  props: {
    maxPrice: {
      type: Number,
      required: true,
    },
    minPrice: {
      type: Number,
      required: true,
    },
  },
};
</script>

<template>
  <div class="&">
    <div v-if="maxPrice !== minPrice">
      {{ $c(maxPrice) }}
    </div>
    <div>
      {{ $c(minPrice) }}
    </div>
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    position: absolute;
    z-index: 1;
    top: 0;
    right: max($spacing-xl, env(safe-area-inset-right));
    bottom: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    color: $secondary;
    text-align: right;
    @include text-xs;
  }
</style>
