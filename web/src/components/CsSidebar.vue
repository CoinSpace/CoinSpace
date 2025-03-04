<script>
import { measureText } from '../lib/helpers.js';

import CsAvatar from './CsAvatar.vue';
import CsButton from '../components/CsButton.vue';
import CsCryptoList from '../components/CsCryptoList.vue';

import PlusIcon from '../assets/svg/plus.svg';

export default {
  components: {
    CsAvatar,
    CsButton,
    CsCryptoList,
    PlusIcon,
  },
  props: {
    active: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      portfolioBalance: 0,
      portfolioBalanceChange: 0,
      portfolioBalanceChangePercent: 0,
      changePeriod: '1D',
    };
  },
  computed: {
    portfolioBalanceSize() {
      if (this.$isHiddenBalance) return 'normal';
      const str = this.$n(this.portfolioBalance, 'currency', {
        currency: this.$currency,
      });
      const { width } = measureText(str);
      if (width < 120) return 'normal';
      if (width < 200) return 'large';
      return '';
    },
  },
  watch: {
    $cryptos: {
      async handler() {
        let portfolioBalance = 0;
        let portfolioBalanceChange = 0;
        for (const item of this.$cryptos) {
          if (item.market?.price) {
            const { change } = item.market;
            const changePercent = change[this.changePeriod] / 100;
            portfolioBalance += item.balanceFiat;
            portfolioBalanceChange += item.balanceFiat * changePercent;
          }
        }
        this.portfolioBalance = portfolioBalance;
        this.portfolioBalanceChange = portfolioBalanceChange;
        this.portfolioBalanceChangePercent = portfolioBalance ? portfolioBalanceChange / portfolioBalance : 0;
      },
      immediate: true,
    },
  },
};
</script>

<template>
  <div
    class="&"
    :class="{ '&--active': active }"
  >
    <div class="&__navbar">
      <CsButton
        @click="$router.push({ name: 'settings' })"
      >
        <CsAvatar
          class="&__avatar"
          :avatar="$user.avatar"
          own
          :size="48"
          :alt="$t('Settings')"
        />
      </CsButton>
      <div
        class="&__portfolio-amount"
        :class="`&__portfolio-amount--${portfolioBalanceSize}`"
        @click="$account.toggleHiddenBalance()"
      >
        {{ $isHiddenBalance ? '*****' : $n(portfolioBalance, 'currency', {
          currency: $currency,
        }) }}
      </div>
      <div class="&__portfolio-label">
        {{ $t('Portfolio value') }}
      </div>
      <div
        class="&__portfolio-change"
        :class="{
          '&__portfolio-change--positive': !$isHiddenBalance && portfolioBalanceChange > 0,
          '&__portfolio-change--negative': !$isHiddenBalance && portfolioBalanceChange < 0
        }"
      >
        <template v-if="!$isHiddenBalance">
          {{ $n(portfolioBalanceChange, 'currency', {
            currency: $currency,
          }) }} ({{ $n(portfolioBalanceChangePercent, 'percent') }}) {{ $t('24h') }}
        </template>
        <template v-else>
          *****
        </template>
      </div>
    </div>

    <div class="&__content">
      <CsCryptoList
        class="&__content-list"
        :header="$t('Wallet')"
        :items="$cryptos"
        :selected="$route.params.cryptoId"
        :changePeriod="changePeriod"
        @select="(id) => $router.push({ name: 'crypto', params: { cryptoId: id }})"
      />
      <CsButton
        type="primary-link"
        class="&__add-crypto"
        @click="$router.push({ name: 'crypto.add', force: true })"
      >
        <PlusIcon />
        {{ $t('Add crypto') }}
      </CsButton>
    </div>
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    display: none;
    width: 100%;
    height: 100%;
    flex-direction: column;
    background-color: $background-color;
    overflow-y: auto;

    @include breakpoint(lg) {
      display: flex;
      width: 22.5rem;
      flex-shrink: 0;
      border-radius: 0.625rem;
    }

    &--active {
      display: flex;
    }

    &__navbar {
      padding:
        $spacing-3xl
        max($spacing-xl, env(safe-area-inset-right))
        $spacing-xl
        max($spacing-xl, env(safe-area-inset-left));
    }

    &__avatar {
      width: $spacing-4xl;
      height: $spacing-4xl;
      margin-bottom: $spacing-3xl;
    }

    &__portfolio-amount {
      @include ellipsis;
      margin-bottom: $spacing-2xs;
      cursor: pointer;
      text-align: center;
      &--large { @include text-lg; }
      &--normal { @include text-3xl; }
    }

    &__portfolio-label {
      @include text-sm;
      margin-bottom: $spacing-2xs;
      color: $secondary;
      text-align: center;
    }

    &__portfolio-change {
      @include text-sm;
      overflow-wrap: break-word;
      text-align: center;

      &--positive {
        color: $primary;
      }

      &--negative {
        color: $danger;
      }
    }

    &__content {
      display: flex;
      flex: 1 1 100%;
      flex-direction: column;
      padding:
        $spacing-xl
        max($spacing-xl, env(safe-area-inset-right))
        $spacing-3xl
        max($spacing-xl, env(safe-area-inset-left));
      gap: $spacing-2xs;
      @include breakpoint(lg) {
        overflow-y: auto;
      }
    }

    &__content-list {
      flex-grow: 1;
    }

    &__add-crypto {
      flex-shrink: 0;
    }
  }
</style>
