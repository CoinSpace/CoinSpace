<script>
import { onShowOnHide } from '../lib/mixins.js';

import CsLoader from './CsLoader.vue';

export default {
  components: {
    CsLoader,
  },
  mixins: [onShowOnHide],
  emits: ['back'],
  data() {
    return {
      isLoading: true,
    };
  },
  async onShow() {
    await this.start();
  },
  async onHide() {
    await this.stop();
  },
  methods: {
    async start() {
      try {
        this.$options.stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 320 },
            height: { ideal: 320 },
          },
          audio: false,
        });
        this.$refs.video.srcObject = this.$options.stream;
        await this.$refs.video.play();
        this.$options.barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
        this.$options.scanInterval = window.setInterval(this.scan, 1000);
        this.isLoading = false;
      } catch (err) {
        // TODO handle errors
        // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#exceptions
        console.error(err);
        this.$emit('back');
      }
    },
    async stop() {
      try {
        clearInterval(this.$options.scanInterval);
        await this.$refs.video.pause();
        if (this.$options.stream) {
          const tracks = this.$options.stream.getTracks();
          tracks.forEach((track) => {
            if (track.readyState === 'live') {
              track.stop();
            }
          });
        }
      } catch (err) {
        // TODO handle errors
        console.error(err);
      }
    },
    async scan() {
      try {
        const barcodes = await this.$options.barcodeDetector.detect(this.$refs.video);
        if (barcodes.length <= 0) return;
        this.$emit('back', { uri: barcodes[0].rawValue });
      } catch (err) {
        // TODO handle errors
        console.error(err);
        this.$emit('back');
      }
    },
  },
};
</script>

<template>
  <CsLoader v-if="isLoading" />
  <div v-show="!isLoading">
    <video
      ref="video"
      class="&__video"
    />
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    $self: &;

    &__video {
      display: block;
      width: 100%;
      max-width: 20rem;
      height: 100%;
      max-height: 20rem;
      border: 1px solid $gray;
      border-radius: 0.625rem;
      margin: 0 auto;
    }
  }
</style>
