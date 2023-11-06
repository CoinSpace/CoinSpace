<script>
import CsCryptoLogo from './CsCryptoLogo.vue';

export default {
  components: {
    CsCryptoLogo,
  },
  props: {
    header: {
      type: String,
      default: undefined,
    },
    items: {
      type: Array,
      required: true,
    },
    selected: {
      type: String,
      default: '',
    },
    columns: {
      type: Boolean,
      default: false,
    },
    changePeriod: {
      type: String,
      default: '',
    },
  },
  emits: ['select'],
  data() {
    return {};
  },
};
</script>

<template>
  <div
    v-if="items.length"
    class="&"
  >
    <div
      v-if="header"
      class="&__header"
    >
      {{ header }}
    </div>
    <div class="&__list">
      <div
        v-for="item in items"
        :key="item.crypto._id"
        class="&__item"
        :class="{
          '&__item--selected': selected === item.crypto._id,
          '&__item--columns': columns === true,
        }"
        @click="$emit('select', item.crypto._id)"
      >
        <CsCryptoLogo
          class="&__logo"
          :crypto="item.crypto"
          :platform="item.platform"
        />
        <div class="&__content">
          <div class="&__title-container">
            <div class="&__title">
              {{ item.title }}
            </div>
            <div
              v-if="item.balanceRound !== undefined"
              class="&__title"
              :title="item.balanceRound"
            >
              {{ item.balanceRound }}
            </div>
          </div>
          <div class="&__subtitle-container">
            <div
              :title="item.subtitle"
              class="&__subtitle"
            >
              {{ item.subtitle }}
            </div>
            <div
              v-if="item.balanceFiat"
              class="&__subtitle"
            >
              {{ $n(item.balanceFiat, 'currency', {
                currency: $currency,
              }) }}
            </div>
          </div>
          <div
            v-if="item.market && changePeriod"
            class="&__subtitle"
          >
            <span>
              {{ $c(item.market.price) }}
            </span>
            <span
              class="&__change"
              :class="{
                '&__change--positive': item.market.change[changePeriod] > 0,
                '&__change--negative': item.market.change[changePeriod] < 0
              }"
            >
              {{ $n(item.market.change[changePeriod] / 100, 'percent') }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    &__header {
      @include text-sm;
      margin-bottom: $spacing-2xs;
      color: $secondary;
    }

    &__list {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-start;
      margin-right: -$spacing-sm;
      margin-left: -$spacing-sm;
    }

    &__item {
      display: flex;
      flex: 0 0 100%;
      align-items: flex-start;
      padding: $spacing-sm;

      border-radius: 0.625rem;
      cursor: pointer;
      gap: $spacing-sm;
      overflow-x: hidden;

      @include hover {
        background-color: $secondary-light;
      }

      &:active {
        background-color: $secondary-light;
      }

      &--selected {
        background-color: $secondary-light;
      }

      &--columns {
        @include breakpoint(lg) {
          flex-basis: 50%;
        }
        @include breakpoint(xl) {
          flex-basis: calc(100% / 3);
        }
      }
    }

    &__logo {
      width: $spacing-3xl;
      height: $spacing-3xl;
      flex: 0 0 auto;
      margin: $spacing-2xs 0;
    }

    &__content {
      flex: 1 1 auto;
      overflow-x: hidden;
    }

    &__title-container {
      display: flex;
      flex: 0 0 100%;
      justify-content: space-between;
      gap: $spacing-md;
    }

    &__title {
      @include text-md;
      @include text-bold;
      @include ellipsis;

      &:first-child {
        flex: 0 0 auto;
      }

      &:last-child {
        flex: 1 1 auto;
      }

      &:nth-child(2) {
        text-align: right;
      }
    }

    &__subtitle-container {
      display: flex;
      flex: 0 0 100%;
      justify-content: space-between;
      gap: $spacing-md;
    }

    &__subtitle {
      color: $secondary;
      @include text-xs;
      @include ellipsis;

      &:nth-child(1) {
        flex: 1 1 auto;
      }

      &:nth-child(2) {
        flex: 0 0 auto;
        text-align: right;
      }
    }

    &__change {
      padding-left: $spacing-xs;

      &--positive {
        color: $primary;
      }

      &--negative {
        color: $danger;
      }
    }
  }
</style>
