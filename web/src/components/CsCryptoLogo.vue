<script>
import TokenIcon from '../assets/svg/token.svg';

export default {
  components: {
    TokenIcon,
  },
  props: {
    crypto: {
      type: Object,
      required: true,
    },
    platform: {
      type: Object,
      default: undefined,
    },
  },
  data() {
    return {
      baseUrl: this.env.VITE_SITE_URL,
      version: this.env.VITE_VERSION,
      cryptoLogoError: false,
      platformLogoError: false,
    };
  },
};
</script>

<template>
  <div class="&">
    <img
      v-if="crypto.logo && !cryptoLogoError"
      loading="lazy"
      class="&__crypto"
      :src="`${baseUrl}assets/crypto/${crypto.logo}?ver=${version}`"
      @error="cryptoLogoError = true"
    >
    <TokenIcon
      v-else
      class="&__crypto"
    />
    <template v-if="crypto.type === 'token'">
      <img
        v-if="platform?.logo && !platformLogoError"
        loading="lazy"
        class="&__platform"
        :src="`${baseUrl}assets/crypto/${platform.logo}?ver=${version}`"
        @error="platformLogoError = true"
      >
      <TokenIcon
        v-else
        class="&__platform"
      />
    </template>
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    position: relative;
    width: 100%;
    height: 100%;

    &__crypto {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    &__platform {
      position: absolute;
      right: -12.5%;
      bottom: -12.5%;
      width: 50%;
      height: 50%;
      border-radius: 50%;
      box-shadow: 0 0 0 1px $white;
    }
  }
</style>
