<script>

import AxisY from './CsPriceChartAxisY.vue';
import CsLoader from '../CsLoader.vue';
import Periods from './CsPriceChartPeriods.vue';

export default {
  components: {
    AxisY,
    CsLoader,
    Periods,
    Apex: {},
  },
  props: {
    chartSeries: {
      type: Object,
      required: true,
    },
    period: {
      type: String,
      required: true,
    },
    isLoading: {
      type: Boolean,
      default: true,
    },
    error: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['changePeriod', 'crosshair'],
  computed: {
    priceRange() {
      let max = this.chartSeries[0][1];
      let min = max;
      for (const item of this.chartSeries) {
        max = item[1] > max ? item[1] : max;
        min = item[1] < min ? item[1] : min;
      }
      return { min, max };
    },
  },
  async loadApex() {
    this.components.Apex = (await import('./CsPriceChartApex.vue')).default;
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
      v-else-if="error || !chartSeries.length"
      class="&__error"
    >
      {{ $account.unknownError() }}
    </div>
    <div
      v-else
      class="&__wrapper"
    >
      <Apex
        :chartSeries="chartSeries"
        @crosshair="(chartPoint) => $emit('crosshair', chartPoint)"
      />
      <AxisY :priceRange="priceRange" />
    </div>
    <Periods
      :period="period"
      @change="(period) => $emit('changePeriod', period)"
    />
  </div>
</template>

<style lang="scss">
  .#{ $filename } {

    user-select: none;

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
