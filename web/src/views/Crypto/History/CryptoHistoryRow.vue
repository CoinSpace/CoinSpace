<script>
import { Transaction } from '@coinspace/cs-common';

import ChangellyExchange from '../../../lib/account/ChangellyExchange.js';
import {
  cryptoToFiat,
} from '../../../lib/helpers.js';

export default {
  components: {
  },
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
    description() {
      if (this.transaction.exchange) {
        if (this.transaction.incoming) {
          return this.$t('Exchanged from {symbol}', { symbol: this.transaction.exchange.cryptoFrom.symbol });
        } else {
          return this.$t('Exchanged to {symbol}', { symbol: this.transaction.exchange.cryptoTo.symbol });
        }
      } else {
        if (this.transaction.incoming) {
          return this.$t('Received');
        } else {
          if (this.transaction.action === Transaction.ACTION_TRANSFER) {
            return this.$t('Sent');
          } else if (this.transaction.action === Transaction.ACTION_TOKEN_TRANSFER) {
            return this.$t('Token transfer');
          } else if (this.transaction.action === Transaction.ACTION_STAKING) {
            return this.$t('Staking');
          } else if (this.transaction.action === Transaction.ACTION_UNSTAKING) {
            return this.$t('Unstaking');
          } else if (this.transaction.action === Transaction.ACTION_SMART_CONTRACT_CALL) {
            return this.$t('Smart contract call');
          }
        }
      }
    },
    status() {
      if (this.transaction.exchange) {
        const { status } = this.transaction.exchange;
        const { timestamp } = this.transaction;
        if (status === ChangellyExchange.STATUS_PENDING) {
          return this.$t('Pending');
        } else if (status === ChangellyExchange.STATUS_EXCHANGING) {
          return this.$t('Exchanging');
        } else if (status === ChangellyExchange.STATUS_SUCCESS) {
          return this.formatDate(timestamp);
        } else if (status === ChangellyExchange.STATUS_REQUIRED_TO_ACCEPT) {
          return this.$t('Required to accept');
        } else if (status === ChangellyExchange.STATUS_HOLD) {
          return this.$t('On hold');
        } else if (status === ChangellyExchange.STATUS_REFUNDED) {
          return this.$t('Refunded');
        } else if (status === ChangellyExchange.STATUS_FAILED) {
          return this.$t('Failed');
        }
      } else {
        const { status, confirmations, minConfirmations, timestamp } = this.transaction;
        if (status === Transaction.STATUS_PENDING) {
          return this.$t('Pending {confirmations}', {
            confirmations: `${confirmations}/${minConfirmations}`,
          });
        } else if (status === Transaction.STATUS_SUCCESS) {
          return this.formatDate(timestamp);
        } else if (status === Transaction.STATUS_FAILED) {
          return this.$t('Failed');
        }
      }
    },
    amountConverted() {
      return this.$c(cryptoToFiat(this.transaction.amount, this.price));
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
        {{ description }}
      </div>
      <div
        class="&__amount-crypto"
        :class="{
          '&__amount-crypto--positive': transaction.incoming,
          '&__amount-crypto--negative': !transaction.incoming,
        }"
      >
        {{ transaction.incoming ? '+' : '-' }}{{ transaction.amount }} {{ $wallet.crypto.symbol }}
      </div>
    </div>
    <div class="&__subtitle">
      <div class="&__status">
        {{ status }}
      </div>
      <div
        v-if="price"
        class="&__amount-fiat"
      >
        {{ amountConverted }}
      </div>
    </div>
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    $self: &;
    padding: $spacing-md $spacing-sm;
    border-radius: 0.625rem;
    cursor: pointer;

    @include hover {
      background-color: $secondary-light;
    }

    &:active {
      background-color: $secondary-light;
    }

    &__title {
      @include text-md;
      display: flex;
      justify-content: space-between;
      gap: $spacing-sm;
    }

    &__subtitle {
      @include text-sm;
      display: flex;
      justify-content: space-between;
      color: $secondary;
      gap: $spacing-sm;
    }

    &__description {
      flex-shrink: 0;
    }

    &__amount-crypto {
      flex-shrink: 1;
      @include ellipsis;

      &--positive {
        color: $primary;
      }

      &--negative {
        color: $danger;
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
