<script>
import CsLoader from './CsLoader.vue';

export default {
  components: {
    CsLoader,
  },
  props: {
    type: {
      type: String,
      default: '',
    },
    size: {
      type: String,
      default: '',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    small: {
      type: Boolean,
      default: false,
    },
    isLoading: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['click'],
};
</script>

<template>
  <button
    type="button"
    class="&"
    :class="{
      [`&--${type}`]: type,
      '&--small': small,
      '&--loading': isLoading,
    }"
    :disabled="disabled"
    @click="!isLoading && !disabled && $emit('click')"
  >
    <CsLoader
      v-if="isLoading"
      :type="type"
    />
    <template v-else>
      <div
        v-if="$slots.circle"
        class="&__circle"
      >
        <slot name="circle" />
      </div>
      <slot />
    </template>
  </button>
</template>

<style lang="scss">
  %base-button {
    display: flex;
    overflow: hidden;
    height: 3.5rem;
    align-items: center;
    justify-content: center;
    padding: 0 $spacing-lg;
    border-radius: 0.625rem;
    gap: $spacing-md;
    line-height: 1.2;
    transition: background-color 0.15s ease-in-out, color 0.15s ease-in-out;

    @include text-md;
    @include text-bold;

    &:disabled {
      opacity: 0.4;
    }

    svg {
      width: $spacing-xl;
      height: $spacing-xl;
      flex-shrink: 0;
    }
  }
  .#{ $filename } {
    $self: &;

    &:disabled {
      pointer-events: none;
    }

    &__circle {
      display: flex;
      width: 3.5rem;
      height: 3.5rem;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background-color: $secondary-light;

      @include hover {
        background-color: darker($secondary-light, 5%);
      }

      &:active {
        background-color: darker($secondary-light, 10%);
      }
    }

    &--base {
      @extend %base-button;
    }

    &--primary {
      @extend %base-button;
      background-color: $primary-brand;

      @include hover {
        background-color: darker($primary-brand, 10%);
      }

      &:active {
        background-color: darker($primary-brand, 15%);
      }
    }

    &--secondary {
      @extend %base-button;
      background-color: $secondary-light;

      @include hover {
        background-color: darker($secondary-light, 5%);
      }

      &:active {
        background-color: darker($secondary-light, 7%);
      }
    }

    &--primary-light {
      @extend %base-button;
      background-color: $primary-light;
      color: $primary;

      @include hover {
        background-color: darker($primary-light, 5%);
      }

      &:active {
        background-color: darker($primary-light, 7%);
      }
    }

    &--danger-light {
      @extend %base-button;
      background-color: $danger-light;
      color: $danger;

      @include hover {
        background-color: darker($danger-light, 5%);
      }

      &:active {
        background-color: darker($danger-light, 7%);
      }
    }

    &--primary-link {
      @extend %base-button;
      background-color: transparent;
      color: $primary;

      @include hover {
        color: darker($primary, 10%);
      }

      &:active {
        color: darker($primary, 15%);
      }
    }

    &--white-link {
      @extend %base-button;
      background-color: transparent;
      color: $white;

      @include hover {
        color: darker($white, 10%);
      }

      &:active {
        color: darker($white, 15%);
      }
    }

    &--danger-link {
      @extend %base-button;
      background-color: transparent;
      color: $danger;

      @include hover {
        color: darker($danger, 10%);
      }

      &:active {
        color: darker($danger, 15%);
      }
    }

    &--circle {
      @extend %base-button;
      height: auto;
      flex: 1 0 $spacing-5xl;
      flex-direction: column;
      justify-content: flex-start;
      padding: 0;
      font-weight: $font-weight-regular;
      gap: $spacing-xs;
      overflow-wrap: anywhere;

      @include text-sm;
    }

    &--small {
      height: 2.75rem;
    }

    &--loading {
      pointer-events: none;
    }
  }
</style>
