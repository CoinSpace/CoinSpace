<script>
import LockIcon from '../assets/svg/lock.svg';
import MastercardIcon from '../assets/svg/mastercard.svg';

export default {
  components: {
    LockIcon,
    MastercardIcon,
  },
  props: {
    size: {
      type: String,
      default: 'medium', // small, medium, large
    },
    productId: {
      type: String,
      default: '', // aurum, azure
    },
    title: {
      type: String,
      default: 'VIRTUAL USD',
    },
    lastFourDigits: {
      type: String,
      default: '',
    },
    locked: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<template>
  <div
    class="&"
    :class="{
      [`&--${productId}`]: productId,
      [`&--${size}`]: size,
      '&--disabled': disabled,
    }"
  >
    <div
      v-if="size !== 'small'"
      class="&__header"
    >
      {{ title }}
    </div>
    <div class="&__footer">
      <div>{{ lastFourDigits }}</div>
      <MastercardIcon class="&__icon" />
    </div>
    <div
      v-if="locked"
      class="&__lock"
    >
      <div class="&__lock-overlay" />
      <div class="&__lock-content">
        <LockIcon class="&__lock-icon" />
        <div>{{ $t('Locked') }}</div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    $self: &;

    position: relative;
    display: flex;
    overflow: hidden;
    flex-direction: column;
    justify-content: space-between;
    aspect-ratio: 3.37 / 2.125;
    color: var(--color-white);

    &__footer {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
    }

    &__icon {
      flex-shrink: 0;
    }

    &__lock {
      position: absolute;
      inset: 0;
    }

    &__lock-icon {
      width: var(--spacing-2xl);
      height: var(--spacing-2xl);

      path {
        stroke: var(--color-primary-button-text);
      }
    }

    &__lock-overlay {
      position: absolute;
      background-color: var(--color-white);
      inset: 0;
      opacity: 0.4;
    }

    &__lock-content {
      @include text-md;
      @include text-bold;
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--color-primary-button-text);
      inset: 0;
    }

    &--disabled {
      opacity: 0.4;
    }

    &--aurum {
      background:
        linear-gradient(
          135deg,
          #b88a0a 0%,
          #977000 50%,
          #7b5a00 100%
        );
    }

    &--azure {
      background:
        linear-gradient(
          135deg,
          #2b8ef0 0%,
          #0066ce 50%,
          #004c99 100%
        );
    }

    &--small {
      @include text-xs;
      width: var(--spacing-5xl);
      justify-content: end;
      padding: var(--spacing-2xs);
      border-radius: var(--spacing-2xs);
      #{ $self }__footer {
        line-height: 1;
      }
      #{ $self }__icon {
        width: var(--spacing-lg);
      }
    }

    &--medium {
      @include text-sm;
      width: 12.5rem;
      padding: var(--spacing-sm);
      border-radius: var(--spacing-xs);
      #{ $self }__icon {
        width: var(--spacing-4xl);
      }
    }

    &--large {
      @include text-md;
      width: 100%;
      max-width: 25rem;
      padding: var(--spacing-md);
      border-radius: var(--spacing-sm);
      #{ $self }__icon {
        width: var(--spacing-6xl);
      }
    }
  }
</style>
