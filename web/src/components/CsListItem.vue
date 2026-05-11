<script>
import ChevronRightIcon from '../assets/svg/chevronRight.svg';

export default {
  components: {
    ChevronRightIcon,
  },
  props: {
    title: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    arrow: {
      type: Boolean,
      default: true,
    },
    type: {
      type: String,
      default: '',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['click'],
};
</script>

<template>
  <li
    class="&"
    :class="{
      '&--clickable': !$slots.after,
      '&--disabled': disabled,
      [`&--${type}`]: type,
    }"
    @click="!disabled && $emit('click')"
  >
    <div
      v-if="$slots.before"
      class="&__before"
    >
      <slot name="before" />
    </div>

    <div class="&__content">
      <slot />
      <div
        v-if="title"
        class="&__title"
      >
        {{ title }}
      </div>
      <div
        v-if="description"
        class="&__description"
      >
        {{ description }}
      </div>
    </div>

    <div
      v-if="$slots.after || arrow"
      class="&__after"
    >
      <slot
        v-if="$slots.after"
        name="after"
      />
      <ChevronRightIcon
        v-else
        class="rtl-mirror"
      />
    </div>
  </li>
</template>

<style lang="scss">
  .#{ $filename } {
    $self: &;
    display: flex;
    min-height: 3.5rem;
    flex-direction: row;
    align-items: center;
    padding-right: max(var(--spacing-xl), env(safe-area-inset-right));
    padding-left: max(var(--spacing-xl), env(safe-area-inset-left));
    gap: var(--spacing-xs);

    @include breakpoint(lg) {
      padding-right: 0;
      padding-left: 0;
    }

    &__content {
      min-width: 20%;
      flex-grow: 1;
      padding-top: var(--spacing-sm);
      padding-bottom: var(--spacing-sm);
    }

    &__title {
      @include text-md;
      @include ellipsis;
    }

    &__description {
      @include text-sm;
      color: var(--color-secondary);
    }

    &__before,
    &__after {
      button {
        width: var(--spacing-xl);
        height: var(--spacing-xl);
      }

      svg {
        width: var(--spacing-xl);
        height: var(--spacing-xl);
      }
    }

    &--clickable {
      cursor: pointer;
    }

    &--disabled {
      opacity: 0.4;
      pointer-events: none;
    }

    &--danger {
      color: var(--color-danger);
    }
  }
</style>
