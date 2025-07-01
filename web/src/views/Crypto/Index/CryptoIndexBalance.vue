<script>
import { cryptoToFiat } from '../../../lib/helpers.js';

export default {
  props: {
    price: {
      type: Number,
      default: 0,
    },
  },
  computed: {
    amount() {
      if (this.$walletState === this.$STATE_LOADING) return '...';
      if (this.$walletState === this.$STATE_ERROR) return '⚠️';
      return `${this.$wallet.balance} ${this.$wallet.crypto.symbol}`;
    },
    fiat() {
      if (this.$walletState === this.$STATE_LOADING) return '...';
      if (this.$walletState === this.$STATE_ERROR) return '⚠️';
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

    <div
      class="&__balance"
      @click="$account.toggleHiddenBalance()"
    >
      <div
        class="&__amount"
        :title="amount"
      >
        {{ $isHiddenBalance ? '*****' : amount }}
        <a
          v-if="$wallet.crypto._id === 'monero@monero' && $wallet.balance.value === 0n && !$isHiddenBalance"
          @click.stop="$safeOpen('https://support.coin.space/hc/en-us/articles/38917242800532')"
        >
          {{ $t('Support') }}
        </a>
      </div>
      <div
        v-if="$wallet.crypto.coingecko"
        class="&__fiat"
        :title="fiat"
      >
        {{ $isHiddenBalance ? '*****' : fiat }}
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
      cursor: pointer;
    }

    &__amount {
      @include text-md;
      @include text-bold;
      @include ellipsis;

      display: flex;
      gap: $spacing-xs;
    }

    &__fiat {
      @include text-sm;
      @include text-bold;
      @include ellipsis;
    }
  }
</style>
