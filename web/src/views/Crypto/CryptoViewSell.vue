<script>
import CsFormSelect from '../../components/CsForm/CsFormSelect.vue';
import CsLoader from '../../components/CsLoader.vue';
import CsProviderList from '../../components/CsProviderList.vue';
import MainLayout from '../../layouts/MainLayout.vue';

import { cryptoSubtitle } from '../../lib/helpers.js';

export default {
  components: {
    MainLayout,
    CsFormSelect,
    CsLoader,
    CsProviderList,
  },
  data() {
    return {
      isLoading: true,
      subtitle: cryptoSubtitle(this.$wallet),
      countryCode: '',
      countries: this.$account.ramps.countries,
      providers: [],
    };
  },
  async mounted() {
    this.countryCode = await this.$account.ramps.getCountryCode();
    this.load();
  },
  methods: {
    async load() {
      this.isLoading = true;
      try {
        this.$account.ramps.setCountryCode(this.countryCode);
        this.providers = await this.$account.ramps.sell(this.countryCode, this.$wallet);
      } catch (err) {
        this.providers = [];
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    },
  },
};
</script>

<template>
  <MainLayout
    :title="$t('Sell {symbol}', { symbol: $wallet.crypto.symbol })"
    :description="subtitle"
  >
    <CsFormSelect
      v-model="countryCode"
      :label="$t('Select your country/region of residence')"
      :options="countries"
      @update:modelValue="load"
    />

    <CsLoader v-if="isLoading" />
    <div v-else>
      <CsProviderList
        v-if="providers.length"
        :items="providers"
        type="sell"
      />
      <div
        v-else
        class="&__empty"
      >
        {{ $t('There are currently no providers available.') }}
      </div>
    </div>
  </MainLayout>
</template>

<style lang="scss">
  .#{ $filename } {
    &__empty {
      @include text-md;
    }
  }
</style>
