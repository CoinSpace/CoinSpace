<script>
import CsButton from './CsButton.vue';
import MainLayout from '../layouts/MainLayout.vue';

import FailCrossIcon from '../assets/svg/failCross.svg';
import SuccessTickIcon from '../assets/svg/successTick.svg';

export default {
  components: {
    MainLayout,
    CsButton,
    FailCrossIcon,
    SuccessTickIcon,
  },
  props: {
    status: {
      type: Boolean,
      default: true,
    },
    title: {
      type: String,
      default: undefined,
    },
    header: {
      type: String,
      default: undefined,
    },
    message: {
      type: String,
      default: undefined,
    },
    action: {
      type: String,
      default: undefined,
    },
  },
  computed: {
    internalTitle() {
      return this.title || this.$t('Confirm transaction');
    },
    internalHeader() {
      if (this.header) {
        return this.header;
      }
      if (this.status) {
        return this.$t('Transaction successful');
      } else {
        return this.$t('Transaction failed');
      }
    },
    internalMessage() {
      if (this.message) {
        return this.message;
      }
      if (this.status) {
        return this.$t('Your transaction will appear in your history tab shortly.');
      } else {
        return this.$t('{name} node error. Please try again later.', {
          name: this.$wallet.crypto.name,
        });
      }
    },
    internalAction() {
      if (this.action) {
        return this.action;
      }
      if (this.status) {
        return this.$t('Done');
      } else {
        return this.$t('Try again');
      }
    },
  },
  methods: {
    done() {
      this.$router.up();
    },
  },
};
</script>

<template>
  <MainLayout :title="internalTitle">
    <div
      class="&__icon"
      :class="{ '&__icon--success': status, '&__icon--failed': !status, }"
    >
      <SuccessTickIcon v-if="status" />
      <FailCrossIcon v-if="!status" />
    </div>
    <div class="&__info">
      <div class="&__info-header">
        {{ internalHeader }}
      </div>
      <div class="&__info-message">
        {{ internalMessage }}
      </div>
    </div>
    <CsButton
      :type="status ? 'primary' : 'danger-light'"
      @click="done"
    >
      {{ internalAction }}
    </CsButton>
  </MainLayout>
</template>

<style lang="scss">
  .#{ $filename } {
    $self: &;

    &__icon {
      width: $spacing-8xl;
      height: $spacing-8xl;
      align-self: center;
      border-radius: 50%;

      &--success {
        background-color: $primary-light;

        svg {
          * {
            stroke: $primary;
          }
        }
      }

      &--failed {
        background-color: $danger-light;

        svg {
          * {
            stroke: $danger;
          }
        }
      }
    }

    &__info {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      gap: $spacing-md;
    }

    &__info-header {
      @include text-lg;
      @include text-bold;
    }

    &__info-message {
      @include text-md;
    }
  }
</style>
