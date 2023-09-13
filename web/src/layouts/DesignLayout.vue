<script>
import CsButton from '../components/CsButton.vue';

export default {
  components: {
    CsButton,
  },
};
</script>

<template>
  <div class="&">
    <CsButton
      class="&__back"
      @click="$router.up()"
    >
      Back
    </CsButton>
    <RouterView />
  </div>
</template>

<style lang="scss">
  .#{ $filename} {
    height: 100%;
    padding: $spacing-xl;
    background-color: $background-color;
    overflow-y: auto;

    &__back {
      display: block;
      margin-bottom: $spacing-lg;
    }
  }
</style>
