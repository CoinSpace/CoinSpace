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
    :src="src"
  >
</template>

<style lang="scss">
  .#{ $filename } {
    width: $spacing-4xl;
    height: $spacing-4xl;
    border-radius: 50%;
    box-shadow: 0 $spacing-md $spacing-xl rgb(0 0 0 / 8%);
  }
</style>
