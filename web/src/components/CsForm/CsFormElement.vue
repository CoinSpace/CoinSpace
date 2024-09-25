<script>
import CsButton from '../CsButton.vue';
import CsModal from '../CsModal.vue';

import InfoIcon from '../../assets/svg/info.svg';

export default {
  components: {
    InfoIcon,
    CsButton,
    CsModal,
  },
  props: {
    label: {
      type: String,
      default: undefined,
    },
    ariaLabel: {
      type: String,
      default: undefined,
    },
    error: {
      type: [Boolean, String],
      default: false,
    },
    small: {
      type: Boolean,
      default: false,
    },
    info: {
      type: [Boolean, String],
      default: false,
    },
    writable: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      showInfo: false,
    };
  },
};
</script>

<template>
  <div
    class="&"
    :class="{
      '&--small': small,
      '&--writable': writable,
      '&--has-error': error,
    }"
  >
    <div class="&__container">
      <label
        class="&__control"
        :aria-label="ariaLabel"
      >
        <div
          v-if="label"
          class="&__label"
        >
          {{ label }}
        </div>
        <div class="&__wrapper">
          <div class="&__box">
            <slot />
          </div>
          <label
            v-if="$slots.extra"
            class="&__box &__box--extra"
          >
            <slot name="extra" />
          </label>
        </div>
      </label>
      <CsButton
        v-if="info"
        type="base"
        class="&__info"
        @click="showInfo = true"
      >
        <InfoIcon />
      </CsButton>
    </div>
    <div
      v-if="error"
      class="&__error"
    >
      {{ error }}
    </div>
    <CsModal
      v-if="info !== false"
      :show="showInfo"
      :title="info"
      @close="showInfo = false"
    >
      <slot name="info" />
      <template
        v-if="$slots.infoFooter"
        #footer
      >
        <slot name="infoFooter" />
      </template>
    </CsModal>
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    $self: &;
    display: flex;
    flex-direction: column;
    gap: $spacing-2xs;

    &__container {
      display: flex;
      align-items: flex-end;
    }

    &__control {
      min-width: 0;
      flex-grow: 1;
    }

    &__label {
      @include text-sm;
      margin-bottom: $spacing-2xs;
      color: $secondary;
    }

    &__wrapper {
      display: flex;
      gap: $spacing-xs;
    }

    &__box {
      @include text-md;
      position: relative;
      display: flex;
      min-width: 0;
      min-height: 3.5rem;
      flex: 1 1 100%;
      align-items: center;
      padding: 0 $spacing-sm;
      border: 1px solid $secondary-light;
      border-radius: 0.625rem;
      background-color: $secondary-light;
      gap: 0.625rem;
      transition: background-color 0.15s ease-in-out, border 0.15s ease-in-out;

      &--extra {
        flex: 1 0 auto;
      }
    }

    &__info {
      flex-shrink: 0;
      padding: 0 $spacing-md;
    }

    &__error {
      @include text-sm;
      color: $danger;
    }

    &--has-error {
      #{ $self }__container {
        div#{ $self }__box {
          border: 1px solid $danger;
          background-color: $danger-light;
        }
      }
    }

    &--small {
      #{ $self }__box {
        min-height: 2.5rem;
      }
    }

    &--writable {
      #{ $self }__label {
        cursor: pointer;
      }
      #{ $self }__box {
        cursor: pointer;

        &:focus-within,
        &:active {
          border: 1px solid $primary-brand;
          background-color: $white;
        }
      }
    }
  }
</style>
