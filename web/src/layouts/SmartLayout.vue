<script>
import CsNavbar from '../components/CsNavbar.vue';
import { onShowOnHide } from '../lib/mixins.js';

import ArrowDownIcon from '../assets/svg/arrowDown.svg';

export default {
  components: {
    CsNavbar,
    ArrowDownIcon,
  },
  mixins: [onShowOnHide],
  props: {
    wide: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    // Common
    isLoading: {
      type: Boolean,
      default: false,
    },
    // Infinite scroll
    isLoadedAll: {
      type: Boolean,
      default: true,
    },
    onLoadMore: {
      type: Function,
      default: undefined,
    },
    loadMoreOffset: {
      type: Number,
      default: 100,
    },
    // Pull to refresh
    onRefresh: {
      type: Function,
      default: undefined,
    },
    refreshOffset: {
      type: Number,
      default: 50,
    },
  },
  data() {
    return {
      touchStartY: undefined,
      touchDistance: 0,
      hasTransition: false,
      hasSuccessTransition: false,
      scrollTop: 0,
    };
  },
  updated() {
    if (this.onLoadMore) {
      this.handleScroll();
    }
  },
  onShow() {
    if (this.onLoadMore) {
      window.addEventListener('resize', this.handleScroll);
      this.$refs.container.addEventListener('scroll', this.handleScroll, { passive: true });
    }
    if (this.onRefresh) {
      this.$refs.container.addEventListener('touchstart', this.handleTouchStart, { passive: true });
      this.$refs.container.addEventListener('touchmove', this.handleTouchMove, { passive: true });
      this.$refs.container.addEventListener('touchend', this.handleTouchEnd, { passive: true });
      this.$refs.container.addEventListener('touchcancel', this.handleTouchCancel, { passive: true });
    }
    if (this.env.VITE_BUILD_TYPE === 'phonegap') {
      window.backButton = () => this.back();
    }
    this.$refs.container.scrollTop = this.scrollTop;
  },
  onHide() {
    window.removeEventListener('resize', this.handleScroll);
    this.$refs.container.removeEventListener('scroll', this.handleScroll);
    this.$refs.container.removeEventListener('touchstart', this.handleTouchStart);
    this.$refs.container.removeEventListener('touchmove', this.handleTouchMove);
    this.$refs.container.removeEventListener('touchend', this.handleTouchEnd);
    this.$refs.container.removeEventListener('touchcancel', this.handleTouchCancel);
    if (this.env.VITE_BUILD_TYPE === 'phonegap') {
      delete window.backButton;
    }
    this.scrollTop = this.$refs.container.scrollTop;
  },
  methods: {
    back() {
      if (this.$parent.$options.extends?.name === 'CsStep') {
        this.$parent.back();
      } else {
        this.$router.up();
      }
    },
    getContentRect() {
      const container = this.$refs.container.getBoundingClientRect();
      const content = this.$refs.content.getBoundingClientRect();
      return {
        top: content.top - container.top,
        bottom: container.bottom - content.bottom,
        height: content.height,
      };
    },
    // Infinite scroll
    handleScroll() {
      if (this.isLoading) return;
      if (this.isLoadedAll) return;
      const { bottom, height } = this.getContentRect();
      if (!height) return;
      if (bottom + this.loadMoreOffset >= 0) {
        this.onLoadMore();
      }
    },
    // Pull to refresh
    handleTouchStart(e) {
      if (this.isLoading) return;
      if (this.hasTransition) return;
      if (e.target.hasAttribute('data-prevent-scroll')) return;
      const { top } = this.getContentRect();
      if (top < 0) return;
      this.touchStartY = e.touches.item(0).pageY;
    },
    handleTouchMove(e) {
      if (this.touchStartY === undefined) return;
      const touchDistanceOld = this.touchDistance;
      const touchDistance = e.touches.item(0).pageY - this.touchStartY;
      if (touchDistance >= 0) {
        this.touchDistance = touchDistance / 3;
      }
      if (touchDistanceOld <= this.refreshOffset && this.touchDistance >= this.refreshOffset) {
        window.taptic?.tap();
      }
    },
    handleTouchEnd() {
      if (this.touchDistance >= this.refreshOffset) {
        this.hasSuccessTransition = true;
        this.onRefresh();
      }
      this.hasTransition = this.touchDistance > 0;
      this.touchStartY = undefined;
      this.touchDistance = 0;
    },
    handleTouchCancel() {
      this.hasTransition = this.touchDistance > 0;
      this.touchStartY = undefined;
      this.touchDistance = 0;
    },
    transitionEnd() {
      this.hasSuccessTransition = false;
      this.hasTransition = false;
    },
  },
};
</script>

<template>
  <div class="&">
    <div class="&__navbar">
      <slot
        v-if="$slots.navbar"
        name="navbar"
        :back="back"
      />
      <CsNavbar
        v-else
        :title="title"
        :description="description"
        @back="back"
      />
    </div>
    <div
      ref="container"
      class="&__container"
      data-transition
      :class="{ '&__container--pulling': touchDistance > 0 || hasTransition }"
    >
      <div
        class="&__pull"
        :class="{
          '&__pull--transition': hasTransition,
        }"
        :style="{
          transform: `translateY(${touchDistance - 24}px)`,
          opacity: touchDistance / refreshOffset
        }"
      >
        <ArrowDownIcon
          class="&__arrow"
          :class="{
            '&__arrow--up': touchDistance >= refreshOffset || hasSuccessTransition,
          }"
        />
      </div>
      <div
        ref="content"
        class="&__content"
        :class="{
          '&__content--narrow': !wide,
          '&__content--transition': hasTransition,
        }"
        :style="{ transform: `translateY(${touchDistance}px)` }"
        @transitionend.self="transitionEnd"
      >
        <slot />
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

    &__container {
      position: relative;
      display: flex;
      height: 100%;
      flex-direction: column;
      align-items: center;
      overflow-y: auto;
      scrollbar-width: thin;

      &--pulling {
        overflow-y: hidden;
      }
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
        flex-basis: 45rem;
        padding: $spacing-3xl $spacing-xl;
      }

      &--narrow {
        @include breakpoint(lg) {
          width: 25rem;
        }
      }

      &--transition {
        transition: transform 0.3s ease-out;
      }
    }

    &__navbar {
      @include breakpoint(lg) {
        border-bottom: 1px solid $divider;
      }
    }

    &__pull {
      position: absolute;
      display: flex;
      width: 100%;
      justify-content: center;

      &--transition {
        transition: transform 0.3s ease-out, opacity 0.3s ease-out;
      }

      svg {
        width: $spacing-xl;
        height: $spacing-xl;
      }
    }

    &__arrow {
      transition: transform 0.2s;

      &--up {
        transform: rotate(180deg);
      }
    }
  }
</style>
