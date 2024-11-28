<script>
import ChangeNowIcon from '../assets/svg/changenow.svg';
import ChangellyIcon from '../assets/svg/changelly.svg';

export default {
  components: {
    ChangeNowIcon,
    ChangellyIcon,
  },
  props: {
    powered: {
      type: String,
      required: true,
    },
  },
  computed: {
    url() {
      if (this.powered === 'changelly') {
        return `https://changelly.com/?ref_id=${this.env.VITE_CHANGELLY_REF}`;
      }
    },
    title() {
      if (this.powered === 'changelly') {
        return 'Changelly';
      }
      if (this.powered === 'changenow') {
        return 'ChangeNOW';
      }
    },
    logo() {
      if (this.powered === 'changelly') {
        return 'ChangellyIcon';
      }
      if (this.powered === 'changenow') {
        return 'ChangeNowIcon';
      }
    },
  },
  methods: {
    open() {
      return this.$safeOpen(this.url);
    },
  },
};
</script>

<template>
  <div
    class="&"
    @click="open"
  >
    {{ $t('Powered by') }} <Component :is="logo" /> {{ title }}
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    @include text-xs;
    color: $secondary;
    cursor: pointer;
    text-align: center;

    svg {
      display: inline-block;
      width: $spacing-lg;
      vertical-align: middle;
    }
  }
</style>
