<script>
import CsNavbarButton from './CsNavbarButton.vue';

import RefreshIcon from '../assets/svg/refresh.svg';

export default {
  components: {
    CsNavbarButton,
    RefreshIcon,
  },
  props: {
    isLoading: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['click'],
  data() {
    return {
      isSpinning: false,
    };
  },
  mounted() {
    // start spinning if isLoading equal true 100ms after mount
    setTimeout(() => this.isSpinning = this.isLoading, 100);
  },
  methods: {
    click() {
      if (this.isLoading) return;
      if (this.isSpinning) return;
      this.isSpinning = true;
      this.$emit('click');
    },
    spinningIteration() {
      this.isSpinning = this.isLoading;
    },
  },
};

</script>

<template>
  <CsNavbarButton
    class="&"
    @click="click"
  >
    <RefreshIcon
      :class="{ '&__spinner': isSpinning }"
      @animationiteration="spinningIteration"
    />
  </CsNavbarButton>
</template>

<style lang="scss">
  .#{ $filename } {
    $self: &;
    display: none;

    @include breakpoint(md) {
      display: flex;
    }

    @media (any-hover: hover) {
      display: flex;
    }

    &__spinner {
      animation: rotation180 0.5s infinite linear;
    }
  }
</style>
