<script>

import AxisY from './CsPriceChartAxisY.vue';
import ChartCanvas from './CsPriceChartCanvas.vue';
import CsLoader from '../CsLoader.vue';
import Periods from './CsPriceChartPeriods.vue';

import { periodToDays } from '../../lib/helpers.js';

export default {
  components: {
    AxisY,
    ChartCanvas,
    CsLoader,
    Periods,
  },
  props: {
    crypto: {
      type: Object,
      required: true,
    },
    period: {
      type: String,
      required: true,
    },
  },
  emits: ['update:period'],
  data() {
    return {
      isLoading: true,
      error: false,
      prices: [], // plain array with prices (minimum 2 items)
    };
  },
  computed: {
    maxPrice() {
      return Math.max(...this.prices);
    },
    minPrice() {
      return Math.min(...this.prices);
    },
  },
  methods: {
    async load() {
      this.isLoading = true;
      this.error = false;

      try {
        await this.$nextTick(); // wait period props
        this.prices = await this.$account.market.getChartData(
          this.crypto._id,
          periodToDays[this.period],
          this.$currency
        );
      } catch (err) {
        console.error(err);
        this.error = true;
      } finally {
        this.isLoading = false;
      }
    },
    async changePeriod(period) {
      this.$emit('update:period', period);
      await this.load();
    },
  },
};
</script>

<template>
  <div class="&">
    <CsLoader
      v-if="isLoading"
      class="&__loader"
    />
    <div
      v-else-if="error"
      class="&__error"
    >
      {{ $t('Error! Please try again later.') }}
    </div>
    <div
      v-else
      class="&__wrapper"
    >
      <ChartCanvas :prices="prices" />
      <AxisY v-bind="{ maxPrice, minPrice }" />
    </div>
    <Periods
      :period="period"
      @change="changePeriod"
    />
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    &__wrapper {
      position: relative;
      padding: $spacing-md 0;
      margin-bottom: $spacing-md;
      @include breakpoint(lg) {
        padding: $spacing-lg 0;
      }
    }

    &__loader,
    &__error {
      height: 10rem + 3 * $spacing-md;
      @include breakpoint(lg) {
        height: 10rem + 2 * $spacing-lg + $spacing-md;
      }
    }

    &__error {
      @include text-sm;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
</style>
