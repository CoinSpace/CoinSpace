<script>
import CsButton from './CsButton.vue';

export default {
  components: {
    CsButton,
  },
};
</script>

<template>
  <CsButton
    class="&"
    type="base"
  >
    <slot />
  </CsButton>
</template>

<style lang="scss">
  .#{ $filename } {
    width: $spacing-5xl;
    height: 100%;
    flex-shrink: 0;
    padding: $spacing-lg;
  }
</style>
