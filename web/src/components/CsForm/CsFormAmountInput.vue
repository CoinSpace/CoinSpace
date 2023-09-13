<script>
import CsAmountInput from '../CsAmountInput.vue';
import CsFormElement from './CsFormElement.vue';
import { cryptoToFiat, fiatToCrypto } from '../../lib/helpers.js';

import {
  Amount,
  utils,
} from '@coinspace/cs-common';

import TrailingIcon from '../../assets/svg/trailing.svg';

export default {
  components: {
    CsAmountInput,
    CsFormElement,
    TrailingIcon,
  },
  props: {
    modelValue: {
      type: Amount,
      default: undefined,
    },
    decimals: {
      type: Number,
      required: true,
    },
    symbol: {
      type: String,
      required: true,
    },
    factors: {
      type: Array,
      default() {
        return [];
      },
    },
    price: {
      type: Number,
      default: undefined,
    },
    currency: {
      type: String,
      default: '',
    },
    label: {
      type: String,
      default: undefined,
    },
    error: {
      type: [Boolean, String],
      default: false,
    },
    small: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      optionValue: this.symbol,
    };
  },
  computed: {
    options() {
      const options = this.factors.length ? this.factors.map((item) => {
        return {
          name: item.name,
          decimals: item.decimals,
        };
      }) : [{
        name: this.symbol,
        decimals: this.decimals,
      }];
      if (this.price !== undefined) {
        options.push({
          name: this.currency,
          decimals: utils.getPrecision(this.price),
          fiat: true,
        });
      }
      return options;
    },
    option() {
      return this.options.find((item) => item.name === this.optionValue);
    },
    inputValue: {
      get() {
        if (this.modelValue === undefined) {
          return undefined;
        }
        if (this.option.fiat) {
          const fiat = cryptoToFiat(this.modelValue, this.price);
          return Amount.fromString(fiat);
        } else {
          return new Amount(this.modelValue.value, this.option.decimals);
        }
      },
      set(amount) {
        if (this.option.fiat) {
          this.$emit('update:modelValue', fiatToCrypto(amount.toString(), this.price, this.decimals));
        } else {
          this.$emit('update:modelValue', new Amount(amount.value, this.decimals));
        }
      },
    },
    amountConverted() {
      if (this.price === undefined) {
        return;
      }
      if (this.modelValue === undefined) {
        return '0';
      }
      if (this.option.fiat) {
        return this.modelValue;
      } else {
        return cryptoToFiat(this.modelValue, this.price, this.decimals);
      }
    },
  },
};
</script>

<template>
  <CsFormElement
    class="&"
    :label="label"
    :error="error"
    :small="small"
  >
    <CsAmountInput
      v-model="inputValue"
      class="&__amount"
      :decimals="option.decimals"
    />
    <template
      v-if="options.length > 1"
      #extra
    >
      <div class="&__value">
        {{ option.name }}
      </div>
      <select
        v-model="optionValue"
        class="&__select"
      >
        <option
          v-for="item in options"
          :key="item.name"
          :value="item.name"
        >
          {{ item.name }}
        </option>
      </select>
      <div
        class="&__icon-after"
      >
        <TrailingIcon />
      </div>
    </template>
    <template
      v-else
      #extra
    >
      <div class="&__value">
        {{ option.name }}
      </div>
    </template>
  </CsFormElement>
  <div
    v-if="price !== undefined"
    class="&__info"
  >
    {{ option.fiat ? `${amountConverted} ${symbol}` : $c(amountConverted) }}
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    &__amount {
      @include ellipsis;
      flex-grow: 1;
    }

    &__value {
      @include ellipsis;
      flex-grow: 1;
    }

    &__select {
      @include text-md;
      @include transparent-stretch;
    }

    &__icon-after {
      width: $spacing-xl;
      height: $spacing-xl;
      flex-shrink: 0;
    }

    &__info {
      @include text-md;
    }
  }
</style>
