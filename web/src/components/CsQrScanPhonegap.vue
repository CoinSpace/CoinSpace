<script>
import { onShowOnHide } from '../lib/mixins.js';

import CsButton from './CsButton.vue';

export default {
  components: {
    CsButton,
  },
  mixins: [onShowOnHide],
  emits: ['back'],
  async onShow() {
    this.start();
  },
  async onHide() {
    this.stop();
  },
  methods: {
    async start() {
      const isReady = await this.prepare();
      if (!isReady) return this.$emit('back');
      window.QRScanner.scan((err, contents) => {
        if (err) {
          console.error(err);
          return this.$emit('back');
        }
        this.$emit('back', { uri: contents });
      });
      window.QRScanner.show();
      window.StatusBar?.styleLightContent();
      document.documentElement.classList.add('qr-scanning');
    },
    stop() {
      window.QRScanner.destroy();
      window.StatusBar?.styleDefault();
      document.documentElement.classList.remove('qr-scanning');
    },
    async prepare() {
      try {
        const result = await new Promise((resolve, reject) => {
          window.QRScanner.prepare((err, status) => {
            if (err) return reject(err);
            if (status.authorized) return resolve(true);
            resolve(false);
          });
        });
        return result;
      } catch (err) {
        if (err.name === 'CAMERA_ACCESS_DENIED') {
          await window.permissionDenied(
            this.$t('Please enable camera access in Settings to continue.'),
            this.$t('OK'),
            [this.$t('Cancel'), this.$t('Settings')]
          );
        } else {
          console.error(err);
        }
      }
      return false;
    },
  },
};
</script>

<template>
  <Teleport to="body">
    <div class="&">
      <div class="&__box-wrapper">
        <div class="&__box" />
      </div>
      <CsButton
        type="white-link"
        @click="$emit('back')"
      >
        {{ $t('Back') }}
      </CsButton>
    </div>
  </Teleport>
</template>

<style lang="scss">
  html.qr-scanning {
    background-color: transparent;

    body {
      background-color: transparent;
    }

    #app {
      display: none;
    }
  }
  .#{ $filename } {
    $self: &;

    display: flex;
    overflow: hidden;
    width: 100%;
    height: 100%;
    flex-direction: column;
    align-items: center;
    padding: $spacing-3xl $spacing-xl;
    gap: $spacing-3xl;

    &__box-wrapper {
      display: flex;
      width: 100%;
      height: 100%;
      align-items: center;
    }

    &__box {
      width: 100%;
      max-width: 20rem;
      height: 100%;
      max-height: 20rem;
      border-radius: 0.625rem;
      margin: 0 auto;
      box-shadow: 0 0 0 3000px rgb(0 0 0 / 60%);
    }
  }
</style>
