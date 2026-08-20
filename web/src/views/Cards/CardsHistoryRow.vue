<script>
import { cryptoToFiat } from '../../lib/helpers.js';

export default {
  props: {
    transaction: {
      type: Object,
      default: undefined,
    },
    price: {
      type: Number,
      default: undefined,
    },
  },
  computed: {
    status() {
      const { status, timestamp } = this.transaction;
      if (status === 'pending') {
        return this.$t('Pending');
      } else if (status === 'success') {
        return this.formatDate(timestamp);
      } else if (status === 'failed') {
        return this.$t('Failed');
      }
    },
    amountConverted() {
      const fiat = cryptoToFiat(this.transaction.amount, this.price);
      return this.$fiat(fiat);
    },
  },
  methods: {
    formatDate(timestamp) {
      const isCurrentYear = timestamp.getFullYear() === (new Date()).getFullYear();
      return this.$d(timestamp, isCurrentYear ? 'shortCurrentYear': 'short');
    },
  },
};
</script>

<template>
  <div class="&">
    <div class="&__title">
      <div class="&__description">
        {{ transaction.incoming ? $t('Top-up') : $t('Purchase') }}
      </div>
      <div
        class="&__amount-crypto"
        :class="{
          '&__amount-crypto--positive': transaction.incoming,
          '&__amount-crypto--negative': !transaction.incoming,
        }"
        dir="ltr"
      >
        {{ transaction.incoming ? '+' : '-' }}{{ transaction.amount }} {{ transaction.symbol }}
      </div>
    </div>
    <div class="&__subtitle">
      <div class="&__status">
        {{ status }}
      </div>
      <div
        class="&__amount-fiat"
        dir="ltr"
      >
        {{ amountConverted }}
      </div>
    </div>
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    $self: &;
    padding: var(--spacing-md) var(--spacing-sm);
    border-radius: 0.625rem;
    cursor: pointer;

    @include hover {
      background-color: var(--color-secondary-light);
    }

    &:active {
      background-color: var(--color-secondary-light);
    }

    &__title {
      @include text-md;
      display: flex;
      justify-content: space-between;
      gap: var(--spacing-sm);
    }

    &__subtitle {
      @include text-sm;
      display: flex;
      justify-content: space-between;
      color: var(--color-secondary);
      gap: var(--spacing-sm);
    }

    &__description {
      flex-shrink: 0;
    }

    &__amount-crypto {
      flex-shrink: 1;
      @include ellipsis;

      &--positive {
        color: var(--color-primary);
      }

      &--negative {
        color: var(--color-danger);
      }
    }

    &__status {
      flex-shrink: 0;
    }

    &__amount-fiat {
      flex-shrink: 1;
      @include ellipsis;
    }
  }
</style>
