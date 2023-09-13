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
        <transition
          :name="route.meta.transition"
          mode="out-in"
        >
          <component
            :is="Component"
            :key="route.path"
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
    gap: $spacing-md;

    @include breakpoint(lg) {
      max-width: $desktop-max-width;
      padding:
        $spacing-md
        max($spacing-md, env(safe-area-inset-right))
        $spacing-md
        max($spacing-md, env(safe-area-inset-left));
      margin: 0 auto;
    }

    &__content {
      display: none;
      width: 100%;
      background-color: $background-color;
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
