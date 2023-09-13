<script>
import { Amount } from '@coinspace/cs-common';

import CsAmountInput from '../../components/CsAmountInput.vue';

export default {
  components: {
    CsAmountInput,
  },
  data() {
    return {
      fiat: new Amount(251230n, 2),
      crypto: new Amount(1251230777n, 8),
      languages: [
        'en',
        'ru',
        'bs',
        'cs',
        'de',
        'es',
        'fil',
        'fr',
        'hr',
        'hu',
        'id',
        'it',
        'ja',
        'km',
        'ko',
        'nb',
        'nl',
        'pl',
        'pt-br',
        'sr',
        'th',
        'tr',
        'uk',
        'vi',
        'zh-cn',
      ],
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
          {{ new Intl.NumberFormat(language, {
            style: 'currency',
            currency,
            currencyDisplay: 'symbol',
          }).format(fiat.toString()) }} - symbol
        </div>
        <div>
          {{ new Intl.NumberFormat(language, {
            style: 'currency',
            currency,
            currencyDisplay: 'narrowSymbol',
          }).format(fiat.toString()) }} - narrowSymbol
        </div>
        <div>
          {{ new Intl.NumberFormat(language, {
            style: 'currency',
            currency,
            currencyDisplay: 'code',
          }).format(fiat.toString()) }} - code
        </div>
        <div>
          {{ new Intl.NumberFormat(language, {
            style: 'currency',
            currency,
            currencyDisplay: 'name',
          }).format(fiat.toString()) }} - name
        </div>
      </div>
      <div>
        Crypto
      </div>
      <div class="&__currency">
        <div>
          {{ new Intl.NumberFormat(language, {
            style: 'currency',
            currency: 'BTC',
            currencyDisplay: 'code',
            minimumFractionDigits: 2,
            maximumFractionDigits: 8,
          }).format(crypto.toString()) }} - currency {{ language }}
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
