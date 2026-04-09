<script>
import { Amount } from '@coinspace/cs-common';

import CsAmountInput from '../../components/CsAmountInput.vue';
import { languages } from '../../lib/i18n/languages.js';

export default {
  components: {
    CsAmountInput,
  },
  data() {
    return {
      fiat: new Amount(251230n, 2),
      crypto: new Amount(1251230777n, 8),
      languages: languages.map((language) => language.value ),
      currencies: [
        'USD',
        'ARS', 'AUD', 'BRL', 'CAD', 'CHF', 'CNY',
        'DKK', 'EUR', 'GBP', 'IDR', 'ILS',
        'JPY', 'MXN', 'NOK', 'NZD', 'PHP', 'PLN',
        'RUB', 'SEK', 'SGD', 'TRY', 'UAH',
        'ZAR',
        'BTC',
        'XXX',
      ],
    };
  },
};
</script>

<template>
  <div class="&">
    <div class="&__header">
      i18n numbers
    </div>
    <div class="&__inputs">
      <div>Amount in USD</div>
      <CsAmountInput
        v-model="fiat"
        :decimals="2"
      />
      <div>Amount in BTC</div>
      <CsAmountInput
        v-model="crypto"
        :decimals="8"
      />
    </div>
    <div
      v-for="language in languages"
      :key="language"
    >
      <div class="&__header">
        Language: {{ language }}
      </div>
      <div
        v-for="currency in currencies"
        :key="currency"
        class="&__currency"
      >
        <div>{{ currency }}</div>
        <div>
          <span dir="ltr">
            {{ new Intl.NumberFormat(language, {
              style: 'currency',
              currency,
              currencyDisplay: 'symbol',
            }).format(fiat.toString()) }}
          </span>
          - symbol
        </div>
        <div>
          <span dir="ltr">
            {{ new Intl.NumberFormat(language, {
              style: 'currency',
              currency,
              currencyDisplay: 'narrowSymbol',
            }).format(fiat.toString()) }}
          </span>
          - narrowSymbol
        </div>
        <div>
          <span dir="ltr">
            {{ new Intl.NumberFormat(language, {
              style: 'currency',
              currency,
              currencyDisplay: 'code',
            }).format(fiat.toString()) }}
          </span>
          - code
        </div>
        <div>
          <span dir="ltr">
            {{ new Intl.NumberFormat(language, {
              style: 'currency',
              currency,
              currencyDisplay: 'name',
            }).format(fiat.toString()) }}
          </span>
          - name
        </div>
      </div>
      <div>
        Crypto
      </div>
      <div class="&__currency">
        <div>
          <span dir="ltr">{{ crypto.toString() }} BTC</span>
          - currency {{ language }}
        </div>
        <div>
          {{ new Intl.NumberFormat(language, {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 8,
          }).format(crypto.toString()) }} - decimal
        </div>
      </div>
      <hr>
    </div>
  </div>
</template>

<style lang="scss">
  .#{ $filename } {
    &__header {
      @include text-2xl;
      margin-bottom: $spacing-xl;
    }

    &__inputs {
      margin-bottom: $spacing-2xl;
    }

    &__currency {
      margin-bottom: $spacing-md;
    }

    hr {
      margin-bottom: $spacing-2xl;
    }
  }
</style>
