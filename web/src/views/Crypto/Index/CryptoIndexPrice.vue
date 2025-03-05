<script>
import CsCryptoLogo from '../../../components/CsCryptoLogo.vue';

import ArrowDecreaseIcon from '../../../assets/svg/arrowDecrease.svg';
import ArrowIncreaseIcon from '../../../assets/svg/arrowIncrease.svg';

export default {
  components: {
    CsCryptoLogo,
    ArrowDecreaseIcon,
    ArrowIncreaseIcon,
  },
  props: {
    price: {
      type: Number,
      default: 0,
    },
    change: {
      type: Number,
      default: 0,
    },
  },
  computed: {
    fiat() {
      if (!this.price) return '';
      return this.$c(this.price);
    },
    changePercent() {
      if (!this.change) return '';
      return this.$n(this.change, 'percent');
    },
    positive() {
      return this.change > 0;
    },
    negative() {
      return this.change < 0;
    },
  },
};
</script>

<template>
  <div class="&">
    <CsCryptoLogo
      class="&__crypto-logo"
      :crypto="$wallet.crypto"
      :platform="$wallet.platform"
    />
    <div
      v-if="$wallet.crypto.coingecko"
      class="&__price-info"
    >
      <div
        class="&__price"
        :title="fiat"
      >
        {{ fiat }}
      </div>
      <div
        class="&__change"
        :class="{
          '&__change--positive': positive,
          '&__change--negative': negative
        }"
      >
        <ArrowIncreaseIcon
          v-if="positive"
          class="&__change_arrow"
        />
        <ArrowDecreaseIcon
          v-if="negative"
          class="&__change_arrow"
        />
        {{ changePercent }}
      </div>
    </div>
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    display: flex;
    flex-basis: 50%;
    gap: $spacing-md;

    &__crypto-logo {
      width: $spacing-3xl;
      height: $spacing-3xl;
    }

    &__price {
      @include text-md;
      @include text-bold;
      @include ellipsis;
    }

    &__change {
      @include text-sm;
      display: flex;
      align-items: center;
      gap: $spacing-2xs;

      &--positive {
        color: $primary;
      }

      &--negative {
        color: $danger;
      }
    }

    &__change_arrow {
      width: $spacing-sm;
      height: $spacing-sm;
    }
  }
</style>
