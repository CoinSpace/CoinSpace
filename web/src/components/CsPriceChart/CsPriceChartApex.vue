<script>
import VueApexCharts from 'vue3-apexcharts';

export default {
  components: {
    apexchart: VueApexCharts,
  },
  props: {
    chartSeries: {
      type: Array,
      required: true,
    },
  },
  emits: ['crosshair'],
  data() {
    const firstPrice = this.chartSeries[0][1];
    const lastPrice = this.chartSeries[this.chartSeries.length - 1][1];
    const color = firstPrice <= lastPrice ? '#68C481' : '#DD230E';
    return {
      dataPointIndex: -1,
      chartOptions: {
        chart: {
          type: 'area',
          sparkline: { enabled: true },
        },
        tooltip: { enabled: true },
        colors: [color],
        fill: {
          type: 'gradient',
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.33,
            gradientFromColors: [color],
          },
        },
        stroke: {
          width: 1,
        },
        markers: {
          strokeWidth: 1,
          strokeOpacity: 1,
          hover: {
            size: 3,
          },
        },
        xaxis: {
          crosshairs: {
            opacity: 1,
            stroke: {
              color,
              width: 1,
              dashArray: 2,
            },
          },
        },
      },
      series: [
        {
          name: 'price',
          data: this.chartSeries,
        },
      ],
    };
  },
  methods: {
    mouseMove(_, __, { dataPointIndex }) {
      this.updateTooltip(true);
      if (dataPointIndex === -1) return;
      if (this.dataPointIndex !== dataPointIndex) {
        this.dataPointIndex = dataPointIndex;
        this.$emit('crosshair', this.series[0].data[dataPointIndex]);
        if (this.env.VITE_PLATFORM === 'ios') window.taptic.tap();
      }
    },
    mouseLeave() {
      this.$emit('crosshair');
      this.updateTooltip(false);
    },
    async touchstart(e) {
      this.updateTooltip(true);
      await this.$nextTick();
      this.touchmove(e);
    },
    touchmove(e) {
      const hoverArea = this.$refs.apex.chart.w.globals.dom.Paper.node;
      const bounds = hoverArea.getBoundingClientRect();
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: e.touches[0].clientX,
        clientY: bounds.top + bounds.height / 2,
        bubbles: true,
      });
      hoverArea.dispatchEvent(mouseEvent);
    },
    touchend() {
      this.$emit('crosshair');
      this.updateTooltip(false);
    },
    touchcancel() {
      this.$emit('crosshair');
      this.updateTooltip(false);
    },
    updateTooltip(enabled) {
      if (enabled === this.chartOptions.tooltip.enabled) return;
      if (!enabled) this.dataPointIndex = -1;
      this.chartOptions = { ...this.chartOptions, ...{ tooltip: { enabled } } };
    },
  },
};
</script>

<template>
  <apexchart
    ref="apex"
    class="&"
    height="160px"
    data-prevent-scroll
    :options="chartOptions"
    :series="series"
    @mouseMove="mouseMove"
    @mouseLeave="mouseLeave"
    @touchend="touchend"
    @touchcancel="touchcancel"
    @touchstart="touchstart"
    @touchmove.prevent="touchmove"
  />
</template>

<style lang="scss">
  .#{ $filename } {
    * {
      transition: none !important;
      @media (hover: none) {
        pointer-events: none;
      }
    }

    .apexcharts-tooltip {
      display: none;
    }
  }
</style>
