<script>
import CsButton from '../components/CsButton.vue';

export default {
  components: {
    CsButton,
  },
  mounted() {
    if (this.env.VITE_BUILD_TYPE === 'phonegap') {
      window.backButton = () => this.back();
    }
  },
  beforeUnmount() {
    if (this.env.VITE_BUILD_TYPE === 'phonegap') {
      delete window.backButton;
    }
  },
  methods: {
    back() {
      this.$router.replace({
        name: 'home',
      });
    },
  },
};
</script>

<template>
  <div class="&">
    <div class="&__container">
      <div class="&__content">
        <div class="&__text">
          <div>
            {{ $t('Error 404 😞') }}
          </div>
        </div>
        <CsButton
          type="primary"
          @click="back"
        >
          {{ $t('Back') }}
        </CsButton>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    display: flex;
    width: 100%;
    height: 100%;
    flex-direction: column;
    background-color: $white;

    &__container {
      display: flex;
      height: 100%;
      flex-direction: column;
      align-items: center;
      overflow-y: auto;
    }

    &__content {
      display: flex;
      width: 100%;
      flex-basis: 100%;
      flex-direction: column;
      padding:
        $spacing-3xl
        max($spacing-xl, env(safe-area-inset-right))
        $spacing-3xl
        max($spacing-xl, env(safe-area-inset-left));
      gap: $spacing-3xl;
      @include breakpoint(lg) {
        // ~ max-height limited by 720px
        width: 25rem;
        flex-basis: 45rem;
        padding: $spacing-3xl $spacing-xl;
      }
    }

    &__text {
      @include text-md;
      display: flex;
      flex-grow: 1;
      align-items: center;
      text-align: center;
      justify-content: center;
    }
  }
</style>
