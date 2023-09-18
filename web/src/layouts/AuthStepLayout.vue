<script>
import CsNavbar from '../components/CsNavbar.vue';
import { onShowOnHide } from '../lib/mixins.js';

export default {
  components: {
    CsNavbar,
  },
  mixins: [onShowOnHide],
  props: {
    title: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    showBack: {
      type: Boolean,
      default: true,
    },
    centered: {
      type: Boolean,
      default: false,
    },
    onBack: {
      type: Function,
      default: undefined,
    },
  },
  data() {
    return {
      scrollTop: 0,
    };
  },
  onShow() {
    if (this.env.VITE_BUILD_TYPE === 'phonegap') {
      document.addEventListener('backbutton', this.back);
    }
    this.$refs.content.scrollTop = this.scrollTop;
  },
  onHide() {
    if (this.env.VITE_BUILD_TYPE === 'phonegap') {
      document.removeEventListener('backbutton', this.back);
    }
    this.scrollTop = this.$refs.content.scrollTop;
  },
  methods: {
    back() {
      if (!this.showBack) return;
      if (this.onBack) {
        this.onBack();
      } else {
        this.$parent.back();
      }
    },
  },
};
</script>

<template>
  <div class="&">
    <div class="&__frame">
      <div class="&__container">
        <CsNavbar
          :title="title"
          :description="description"
          :showBack="showBack"
          :centered="centered"
          @back="back"
        />
        <div
          ref="content"
          class="&__content"
          data-transition
        >
          <slot />
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
  }
</style>
