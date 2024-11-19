<script>
import { cryptoSubtitleWithSymbol } from '../../../lib/helpers.js';

import CsNavbar from '../../../components/CsNavbar.vue';
import CsNavbarButton from '../../../components/CsNavbarButton.vue';
import CsPriceChart from '../../../components/CsPriceChart/CsPriceChart.vue';
import CsRefreshButton from '../../../components/CsRefreshButton.vue';
import SmartLayout from '../../../layouts/SmartLayout.vue';

import CryptoIndexActions from './CryptoIndexActions.vue';
import CryptoIndexBalance from './CryptoIndexBalance.vue';
import CryptoIndexBuySell from './CryptoIndexBuySell.vue';
import CryptoIndexConfirmRemove from './CryptoIndexConfirmRemove.vue';
import CryptoIndexDropdownMenu from './CryptoIndexDropdownMenu.vue';
import CryptoIndexPrice from './CryptoIndexPrice.vue';
import CryptoIndexSetupEOS from './CryptoIndexSetupEOS.vue';
import CryptoIndexTools from './CryptoIndexTools.vue';

import ArrowLeftIcon from '../../../assets/svg/arrowLeft.svg';

export default {
  components: {
    CryptoIndexActions,
    CryptoIndexBalance,
    CryptoIndexBuySell,
    CryptoIndexConfirmRemove,
    CryptoIndexDropdownMenu,
    CryptoIndexPrice,
    CryptoIndexSetupEOS,
    CryptoIndexTools,
    SmartLayout,
    CsPriceChart,
    CsNavbar,
    CsNavbarButton,
    CsRefreshButton,
    ArrowLeftIcon,
  },
  data() {
    return {
      marketState: undefined, // $STATE_LOADING, $STATE_LOADED, $STATE_ERROR
      period: '1D',
      showConfirmRemove: false,
      subtitleWithSymbol: cryptoSubtitleWithSymbol(this.$wallet),
    };
  },
  computed: {
    isLoading() {
      return this.$walletState === this.$STATE_LOADING || this.marketState === this.$STATE_LOADING;
    },
    price() {
      return this.market?.price || 0;
    },
    change() {
      return this.market?.change[this.period] / 100 || 0;
    },
    market() {
      return this.$cryptos.find((item) => {
        return item.crypto._id === this.$wallet.crypto._id;
      })?.market;
    },
  },
  mounted() {
    if (this.$walletState === this.$STATE_LOADED) {
      this.$wallet.cleanup();
      this.$account.emit('update');
    }
    this.loadPriceChart();
  },
  methods: {
    async refresh() {
      await Promise.all([
        this.$loadWallet(),
        this.loadPriceChart(),
      ]);
    },
    async loadPriceChart() {
      this.marketState = this.$STATE_LOADING;
      try {
        await this.$refs.priceChart?.load();
        this.marketState = this.$STATE_LOADED;
      } catch (err) {
        console.error(err);
        this.marketState = this.$STATE_ERROR;
      }
    },
    async remove() {
      this.showConfirmRemove = false;
      await this.$account.removeWallet(this.$wallet.crypto);
      this.$router.up();
    },
  },
};
</script>
<template>
  <SmartLayout
    wide
    :isLoading="isLoading"
    @refresh="refresh"
  >
    <template #navbar="{ back }">
      <CsNavbar
        :title="$wallet.crypto.name"
        :description="subtitleWithSymbol"
      >
        <template #left>
          <CsNavbarButton
            :title="$t('Back')"
            :aria-label="$t('Back')"
            @click="back"
          >
            <ArrowLeftIcon />
          </CsNavbarButton>
        </template>
        <template #right>
          <CsRefreshButton
            :isLoading="isLoading"
            @click="refresh"
          />
          <CryptoIndexDropdownMenu
            @remove="showConfirmRemove = true"
          />
        </template>
      </CsNavbar>
    </template>

    <div class="&__header-container">
      <div class="&__header">
        <CryptoIndexPrice
          :price="price"
          :change="change"
          :marketState="marketState"
        />
        <CryptoIndexBuySell />
      </div>
      <CsPriceChart
        v-if="$wallet.crypto.coingecko"
        ref="priceChart"
        v-model:period="period"
        class="&__price-chart"
        :crypto="$wallet.crypto"
      />
    </div>
    <CryptoIndexBalance
      :price="price"
      :marketState="marketState"
    />
    <CryptoIndexActions />

    <div
      v-if="$walletState === $STATE_ERROR"
      class="&__error"
    >
      {{ ($isOnion && $onLine)
        ? $t('Error! Please ensure that your Tor VPN is active.')
        : $t('Error! Please try again later.') }}
    </div>
    <CryptoIndexSetupEOS />

    <CryptoIndexTools
      @remove="showConfirmRemove = true"
    />
    <CryptoIndexConfirmRemove
      :show="showConfirmRemove"
      @confirm="remove"
      @cancel="showConfirmRemove = false"
    />
  </SmartLayout>
</template>

<style lang="scss">
  .#{ $filename } {
    $self: &;

    &__header-container {
      display: flex;
      flex-direction: column;
      gap: $spacing-lg;
    }

    &__header {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      justify-content: space-between;
      gap: $spacing-lg;
    }

    &__price-chart {
      margin-right: calc(-1 * max($spacing-xl, env(safe-area-inset-right)));
      margin-left: calc(-1 * max($spacing-xl, env(safe-area-inset-left)));
    }

    &__error {
      @include text-md;
    }
  }
</style>
