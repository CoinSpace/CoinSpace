<script>
import CsSidebar from '../components/CsSidebar.vue';

export default {
  components: {
    CsSidebar,
  },
};
</script>

<template>
  <div class="&">
    <CsSidebar :active="$route.name === 'home'" />
    <div
      class="&__content"
      :class="{ '&__content--active': $route.name !== 'home' }"
    >
      <RouterView v-slot="{ Component, route }">
        <component
          :is="Component"
          v-if="route.path === '/'"
        />
        <transition
          v-else
          :name="route.meta.transition"
        >
          <component
            :is="Component"
            :key="route.path + route.meta.ts"
          />
        </transition>
      </RouterView>
    </div>
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    display: flex;
    height: 100%;
    padding-top: env(safe-area-inset-top);
    gap: var(--spacing-md);

    @include breakpoint(lg) {
      max-width: var(--desktop-max-width);
      padding:
        max(var(--spacing-md), env(safe-area-inset-top))
        max(var(--spacing-md), env(safe-area-inset-right))
        max(var(--spacing-md), env(safe-area-inset-bottom))
        max(var(--spacing-md), env(safe-area-inset-left));
      margin: 0 auto;
    }

    &__content {
      display: none;
      overflow: hidden;
      width: 100%;
      background-color: var(--color-background);
      @include breakpoint(lg) {
        display: block;
        border-radius: 0.625rem;
      }

      &--active {
        display: block;
      }
    }
  }
</style>
