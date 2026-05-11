<script>
import CsCryptoLogo from './CsCryptoLogo.vue';
import TickIcon from '../assets/svg/tick.svg';

export default {
  components: {
    CsCryptoLogo,
    TickIcon,
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
      type: [String, Set],
      default: '',
    },
    multiple: {
      type: Boolean,
      default: false,
    },
    isLoading: {
      type: Boolean,
      default: false,
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
  methods: {
    isSelected(id) {
      if (this.multiple) {
        return this.selected.has(id);
      } else {
        return this.selected === id;
      }
    },
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
    <ul
      class="&__list"
      :class="{
        '&__list--loading': isLoading,
      }"
    >
      <li
        v-for="item in items"
        :key="item.crypto._id"
        class="&__item"
        :class="{
          '&__item--selected': isSelected(item.crypto._id),
          '&__item--columns': columns === true,
        }"
        @click="!isLoading && $emit('select', item.crypto._id)"
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
              v-if="!$isHiddenBalance && item.balanceRound !== undefined"
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
              v-if="!$isHiddenBalance && item.balanceFiat"
              class="&__subtitle"
              dir="ltr"
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
            <span dir="ltr">
              {{ $c(item.market.price) }}
            </span>
            <span
              v-if="item.market.change[changePeriod]"
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
        <div
          v-if="multiple && isSelected(item.crypto._id)"
          class="&__multiple"
        >
          <TickIcon class="&__tick" />
        </div>
      </li>
    </ul>
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    &__header {
      @include text-sm;
      margin-bottom: var(--spacing-2xs);
      color: var(--color-secondary);
    }

    &__list {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-start;
      padding: 0;
      margin: 0 calc(-1 * var(--spacing-sm));
      gap: var(--spacing-2xs);
      list-style: none;

      &--loading {
        opacity: 0.4;
        pointer-events: none;
      }
    }

    &__item {
      display: flex;
      flex: 0 0 100%;
      align-items: flex-start;
      padding: var(--spacing-sm);

      border-radius: 0.625rem;
      cursor: pointer;
      gap: var(--spacing-sm);
      overflow-x: hidden;

      @include hover {
        background-color: var(--color-secondary-light);
      }

      &:active {
        background-color: var(--color-secondary-light);
      }

      &--selected {
        background-color: var(--color-secondary-light);
      }

      &--columns {
        @include breakpoint(lg) {
          flex-basis: calc((100% - var(--spacing-2xs)) / 2);
        }
        @include breakpoint(xl) {
          flex-basis: calc((100% - 2 * var(--spacing-2xs)) / 3);
        }
      }
    }

    &__logo {
      width: var(--spacing-3xl);
      height: var(--spacing-3xl);
      flex: 0 0 auto;
      margin: var(--spacing-2xs) 0;
    }

    &__content {
      flex: 1 1 auto;
      overflow-x: hidden;
    }

    &__title-container {
      display: flex;
      flex: 0 0 100%;
      justify-content: space-between;
      gap: var(--spacing-md);
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
        text-align: end;
      }
    }

    &__subtitle-container {
      display: flex;
      flex: 0 0 100%;
      justify-content: space-between;
      gap: var(--spacing-md);
    }

    &__subtitle {
      color: var(--color-secondary);
      @include text-xs;
      @include ellipsis;

      &:nth-child(1) {
        flex: 1 1 auto;
      }

      &:nth-child(2) {
        flex: 0 0 auto;
        text-align: end;
      }
    }

    &__change {
      padding-inline-start: var(--spacing-xs);

      &--positive {
        color: var(--color-primary);
      }

      &--negative {
        color: var(--color-danger);
      }
    }

    &__multiple {
      align-self: center;
    }

    &__tick {
      width: var(--spacing-xl);
      height: var(--spacing-xl);
    }
  }
</style>
