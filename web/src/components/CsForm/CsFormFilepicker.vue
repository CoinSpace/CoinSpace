<script>
import { dataUrlSize } from '../../lib/helpers.js';

import CloseIcon from '../../assets/svg/close.svg';
import CsFormElement from './CsFormElement.vue';

export default {
  components: {
    CsFormElement,
    CloseIcon,
  },
  props: {
    modelValue: {
      type: Object,
      default: undefined,
    },
    label: {
      type: String,
      default: undefined,
    },
    error: {
      type: [Boolean, String],
      default: false,
    },
    placeholder: {
      type: String,
      default: '',
    },
    fileType: {
      type: String,
      default: 'photo',
    },
    fileAccept: {
      type: String,
      default: 'image/png, image/jpeg',
    },
    capture: {
      type: String,
      default: undefined, // 'user', 'environment'
    },
    fileMaxSize: {
      type: Number,
      default: 1 * 1024 * 1024,
    },
    photoMinEdge: {
      type: Number,
      default: 300,
    },
    clear: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue'],
  data() {
    let internalCapture = this.capture;
    if (this.env.VITE_PLATFORM === 'android' && this.fileType === 'photo' && this.capture === undefined) {
      internalCapture = 'environment'; // add camera https://github.com/apache/cordova-android/pull/1609
    }
    return {
      filename: '',
      internalCapture,
    };
  },
  methods: {
    async click(event) {
      if (this.env.VITE_BUILD_TYPE !== 'phonegap') return;
      if (this.fileType !== 'photo') return;
      if (event.target !== this.$refs.input) return;
      if (event.isTrusted) {
        event.preventDefault();
        const isReady = await window.prepareCamera(this);
        window.QRScanner.destroy();
        if (isReady) event.target.click();
      }
    },
    async change(event) {
      const input = event.target;
      const file = input.files && input.files[0];
      if (!file) return;

      this.filename = file.name;

      try {
        let value;
        if (this.fileType === 'photo' && file.type.startsWith('image/')) {
          value = await this.processPhoto(file);
        } else {
          value = await this.readAsDataUrl(file);
        }
        this.$emit('update:modelValue', value);
      } catch (err) {
        console.error('Failed to read file', err);
        this.filename = '';
        this.$emit('update:modelValue', undefined);
      } finally {
        input.value = '';
      }
    },

    onClear() {
      this.$emit('update:modelValue', undefined);
      this.filename = '';
    },

    readAsDataUrl(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ dataUrl: reader.result, size: dataUrlSize(reader.result) });
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    },

    async processPhoto(file) {
      const img = await this.loadImage(file);
      const naturalMinEdge = Math.min(img.naturalWidth, img.naturalHeight);

      if (file.size <= this.fileMaxSize) {
        const { dataUrl, size } = await this.readAsDataUrl(file);
        return { dataUrl, size, photoMinEdge: naturalMinEdge };
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const minScale = Math.min(1, this.photoMinEdge / naturalMinEdge);

      let scale = 1;
      let dataUrl = '';
      let width = img.naturalWidth;
      let height = img.naturalHeight;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        width = Math.max(1, Math.round(img.naturalWidth * scale));
        height = Math.max(1, Math.round(img.naturalHeight * scale));

        canvas.width = width;
        canvas.height = height;
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        dataUrl = canvas.toDataURL('image/jpeg', 0.9);

        if (dataUrlSize(dataUrl) <= this.fileMaxSize) break;

        if (scale <= minScale) break;
        scale = Math.max(minScale, scale * 0.85);
      }

      return { dataUrl, size: dataUrlSize(dataUrl), photoMinEdge: Math.min(width, height) };
    },

    loadImage(file) {
      return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve(img);
        };
        img.onerror = (err) => {
          URL.revokeObjectURL(url);
          reject(err);
        };
        img.src = url;
      });
    },
  },
};
</script>

<template>
  <CsFormElement
    class="&"
    v-bind="$props"
    @click="click"
  >
    <div
      class="&__filename"
      :class="{'&__filename--empty': !filename }"
    >
      {{ filename || placeholder }}
    </div>

    <input
      ref="input"
      type="file"
      class="&__input"
      :placeholder="placeholder"
      :accept="fileAccept"
      :capture="internalCapture"
      @change="change"
    >
    <div
      v-if="clear && modelValue"
      class="&__icon-after"
      role="button"
      :title="$t('Clear')"
      :aria-label="$t('Clear')"
      @click.prevent="$emit('update:modelValue', undefined); filename = ''"
    >
      <CloseIcon />
    </div>
  </CsFormElement>
</template>

<style lang="scss">
  .#{ $filename } {
    &__filename {
      @include ellipsis;
      flex-grow: 1;

      &--empty {
        color: var(--color-secondary);
      }
    }

    &__input {
      position: absolute;
      width: 0;
      opacity: 0;
    }

    &__icon-after {
      width: var(--spacing-xl);
      height: var(--spacing-xl);
      flex-shrink: 0;
    }
  }
</style>
