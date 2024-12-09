<script>
import { base64 } from '@scure/base';
import { toSvg } from 'jdenticon';

export default {
  props: {
    avatar: {
      type: String,
      default: '',
    },
    size: {
      type: Number,
      default: 48,
    },
    own: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    src() {
      const [type, hash] = this.avatar.split(':');
      if (type === 'gravatar') {
        return `https://www.gravatar.com/avatar/${hash}?size=${this.size}`;
      } else if (type === 'identicon') {
        const svg = toSvg(hash, this.size, { padding: 0 });
        return `data:image/svg+xml;base64,${base64.encode(new TextEncoder().encode(svg))}`;
      }
    },
  },
};
</script>

<template>
  <img
    class="&"
    :class="{
      '&--own': own,
      '&--own-tor': own && ($isOnion || env.VITE_DISTRIBUTION === 'tor'),
    }"
    :src="src"
  >
</template>

<style lang="scss">
  .#{ $filename } {
    width: $spacing-4xl;
    height: $spacing-4xl;
    border-radius: 50%;
    box-shadow: 0 $spacing-md $spacing-xl rgb(0 0 0 / 8%);

    &--own {
      outline: 2px solid transparent;
      transition: all 0.1s ease-out;
    }

    &--own-tor {
      box-shadow: 0 $spacing-md $spacing-xl rgb(138 43 226 / 8%);
      outline: 2px solid #8a2be2;
    }
  }
</style>
