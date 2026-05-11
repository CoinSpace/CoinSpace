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
            @click="$router.replace({ name: 'home' })"
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
        max(var(--spacing-md), env(safe-area-inset-top))
        max(var(--spacing-md), env(safe-area-inset-right))
        max(var(--spacing-md), env(safe-area-inset-bottom))
        max(var(--spacing-md), env(safe-area-inset-left));
      overflow-y: auto;
    }

    &__frame {
      display: flex;
      width: 100%;
      height: 100%;
      flex-direction: column;
      flex-grow: 1;
      align-items: center;
      background-color: var(--color-background);

      @include breakpoint(lg) {
        max-width: var(--desktop-max-width);
        height: auto;
        padding-top: var(--spacing-6xl);
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
        var(--spacing-3xl)
        max(var(--spacing-xl), env(safe-area-inset-right))
        max(var(--spacing-3xl), env(safe-area-inset-bottom))
        max(var(--spacing-xl), env(safe-area-inset-left));
      gap: var(--spacing-3xl);
      overflow-y: auto;

      @include breakpoint(lg) {
        padding: var(--spacing-3xl) var(--spacing-xl);
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
