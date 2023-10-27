<script>
import CsButton from '../components/CsButton.vue';

export default {
  components: {
    CsButton,
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
    <div class="&__frame">
      <div class="&__container">
        <div class="&__content">
          <div class="&__text">
            <div>
              {{ $t('Error') + ' 404 😞' }}
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
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    display: flex;
    height: 100%;
    flex-direction: column;
    align-items: center;
    padding-top: env(safe-area-inset-top);

    @include breakpoint(lg) {
      padding:
        max($spacing-md, env(safe-area-inset-top))
        max($spacing-md, env(safe-area-inset-right))
        $spacing-md
        max($spacing-md, env(safe-area-inset-left));
      overflow-y: auto;
    }

    &__frame {
      display: flex;
      width: 100%;
      height: 100%;
      flex-direction: column;
      flex-grow: 1;
      align-items: center;
      background-color: $background-color;

      @include breakpoint(lg) {
        max-width: $desktop-max-width;
        height: auto;
        padding-top: $spacing-6xl;
        border-radius: 0.625rem;
      }
    }

    &__container {
      display: flex;
      width: 100%;
      height: 100%;
      flex-direction: column;
      @include breakpoint(lg) {
        width: 25rem;
        max-height: 45rem;
      }
    }

    &__content {
      display: flex;
      width: 100%;
      height: 100%;
      flex-direction: column;
      padding:
        $spacing-3xl
        max($spacing-xl, env(safe-area-inset-right))
        $spacing-3xl
        max($spacing-xl, env(safe-area-inset-left));
      gap: $spacing-3xl;
      overflow-y: auto;

      @include breakpoint(lg) {
        padding: $spacing-3xl $spacing-xl;
      }
    }

    &__text {
      @include text-md;
      display: flex;
      flex-grow: 1;
      align-items: center;
      justify-content: center;
    }
  }
</style>
