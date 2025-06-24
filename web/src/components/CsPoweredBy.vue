<script>

export default {
  props: {
    powered: {
      type: Object,
      required: true,
    },
  },
  methods: {
    open() {
      return this.$safeOpen(this.powered.url);
    },
  },
};
</script>

<template>
  <div
    class="&"
    @click="open"
  >
    {{ $t('Powered by') }}
    <img
      loading="lazy"
      :src="powered.logo"
      :alt="powered.name"
    >
    {{ powered.name }}
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    @include text-xs;
    color: $secondary;
    cursor: pointer;
    text-align: center;

    img {
      display: inline-block;
      width: $spacing-lg;
      vertical-align: middle;
    }
  }
</style>
