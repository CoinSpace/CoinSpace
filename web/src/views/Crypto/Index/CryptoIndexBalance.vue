<script>
import { cryptoToFiat } from '../../../lib/helpers.js';

export default {
  props: {
    price: {
      type: Number,
      default: 0,
    },
    marketState: {
      type: Symbol,
      default: undefined,
    },
  },
  computed: {
    amount() {
      if (this.$walletState === this.$STATE_LOADING) return '...';
      if (this.$walletState === this.$STATE_ERROR) return '⚠️';
      return `${this.$wallet.balance} ${this.$wallet.crypto.symbol}`;
    },
    fiat() {
      if (this.$walletState === this.$STATE_LOADING || this.marketState === this.$STATE_LOADING) return '...';
      if (this.$walletState === this.$STATE_ERROR || this.marketState === this.$STATE_ERROR) return '⚠️';
      const fiat = cryptoToFiat(this.$wallet.balance, this.price);
      return this.$c(fiat);
    },
  },
};
</script>

<template>
  <div
    v-if="$walletState === $STATE_LOADED || $walletState === $STATE_LOADING"
    class="&"
  >
    <div class="&__header">
      {{ $t('Balance') }}
    </div>

    <div class="&__balance">
      <div
        class="&__amount"
        :title="amount"
      >
        {{ amount }}
      </div>
      <div
        v-if="$wallet.crypto.coingecko"
        class="&__fiat"
        :title="fiat"
      >
        {{ fiat }}
      </div>
    </div>
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    display: flex;
    flex-direction: column;
    gap: $spacing-2xs;

    &__header {
      @include text-sm;
      color: $secondary;
    }

    &__balance {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      justify-content: space-between;
      column-gap: $spacing-md;
    }

    &__amount {
      @include text-md;
      @include text-bold;
      @include ellipsis;
    }

    &__fiat {
      @include text-sm;
      @include text-bold;
      @include ellipsis;
    }
  }
</style>
