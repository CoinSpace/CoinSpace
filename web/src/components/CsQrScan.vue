<script>
import { onShowOnHide } from '../lib/mixins.js';

export default {
  components: {
  },
  mixins: [onShowOnHide],
  emits: ['back'],
  data() {
    return {
      address: '',
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
          },
          audio: false,
        });
        this.$refs.video.srcObject = this.$options.stream;
        await this.$refs.video.play();
        this.$options.barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
        this.$options.scanInterval = window.setInterval(this.scan, 1000);
      } catch (err) {
        // TODO handle errors
        console.error(err);
      }
    },
    async stop() {
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
        this.address = barcodes[0].rawValue;
        setTimeout(() => {
          this.$emit('back', { address: barcodes[0].rawValue });
        }, 500);
      } catch (err) {
        // TODO handle errors
        console.error(err);
      }
    },
  },
};
</script>

<template>
  <video
    ref="video"
    style="width: 100%; height: 100%;"
  />
  <div> {{ address }} </div>
</template>
