<script>
import { onShowOnHide } from '../lib/mixins.js';

export default {
  components: {
  },
  mixins: [onShowOnHide],
  emits: ['back'],
  data() {
    return {
      visible: false,
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
        // TODO video size
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
        this.visible = true;
      } catch (err) {
        // TODO handle errors
        console.error(err);
      }
    },
    async stop() {
      this.visible = false;
      try {
        clearInterval(this.$options.scanInterval);
        await this.$refs.video.pause();
        const tracks = this.$options.stream.getTracks();
        tracks.forEach((track) => {
          if (track.readyState === 'live') {
            track.stop();
          }
        });
      } catch (err) {
        // TODO handle errors
        console.error(err);
      }
    },
    async scan() {
      try {
        const barcodes = await this.$options.barcodeDetector.detect(this.$refs.video);
        if (barcodes.length <= 0) return;
        this.stop();
        this.$emit('back', { address: barcodes[0].rawValue });
      } catch (err) {
        // TODO handle errors
        console.error(err);
      }
    },
  },
};
</script>

<template>
  <div>
    <video
      v-show="visible"
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
      height: 100%;
      border: 1px solid $gray;
      border-radius: $spacing-lg;
    }
  }
</style>
