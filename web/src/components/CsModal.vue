<script>
import CloseIcon from '../assets/svg/close.svg';
import { onShowOnHide } from '../lib/mixins.js';

export default {
  components: {
    CloseIcon,
  },
  mixins: [onShowOnHide],
  props: {
    show: Boolean,
    title: {
      type: String,
      required: true,
    },
  },
  emits: ['close'],
  onShow() {
    window.addEventListener('keydown', this.keydown);
  },
  onHide() {
    window.removeEventListener('keydown', this.keydown);
  },
  methods: {
    keydown({ key }) {
      if (key === 'Esc' || key === 'Escape') {
        this.$emit('close');
      }
    },
  },
};
</script>

<template>
  <Teleport to="body">
    <Transition name="cs-modal-transition">
      <div
        v-if="show"
        class="&__overlay"
        @click="$emit('close')"
      >
        <div
          class="&__container"
          @click.stop
        >
          <div class="&__header">
            <div class="&__title">
              {{ title }}
            </div>
            <CloseIcon
              class="&__close"
              @click="$emit('close')"
            />
          </div>

          <div class="&__body">
            <slot />
          </div>

          <div
            v-if="$slots.footer"
            class="&__footer"
          >
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss">
  .#{ $filename } {
    $self: &;

    &-transition-enter-active {
      transition: all 0.2s ease-in;
    }

    &-transition-enter-from,
    &-transition-leave-to {
      opacity: 0;
      transform: scale(1.1);
    }

    &-transition-leave-active {
      transition: all 0.1s ease-out;
    }

    &__overlay {
      position: fixed;
      z-index: $zindex-modal;
      top: -1px; // disable navbar hiding on mobile devices
      right: 0;
      bottom: 0;
      left: 0;
      display: flex;
      padding: $spacing-xl;
      background-color: rgb(0 0 0 / 30%);
      overflow-y: auto;
    }

    &__container {
      display: flex;
      width: 100%;
      flex: 0 1 25rem;
      flex-direction: column;
      padding: $spacing-xl;
      border-radius: 0.625rem;
      margin: auto;
      background-color: $white;
      gap: $spacing-xl;
    }

    &__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: $spacing-xl;
    }

    &__title {
      @include text-lg;
      @include text-bold;
    }

    &__close {
      width: $spacing-xl;
      height: $spacing-xl;
      flex-grow: 0;
      flex-shrink: 0;
      cursor: pointer;
    }

    &__body {
      @include text-md;
      display: flex;
      flex-direction: column;
      gap: $spacing-md;
    }
  }
</style>
