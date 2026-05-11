<script>
export default {
  props: {
    priceRange: {
      type: Object,
      required: true,
    },
  },
};
</script>

<template>
  <div class="&">
    <div
      v-if="priceRange.max !== priceRange.min"
      dir="ltr"
    >
      {{ $c(priceRange.max) }}
    </div>
    <div dir="ltr">
      {{ $c(priceRange.min) }}
    </div>
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    position: absolute;
    z-index: -1;
    top: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    color: var(--color-secondary);
    text-align: end;
    @include text-xs;
  }
</style>
