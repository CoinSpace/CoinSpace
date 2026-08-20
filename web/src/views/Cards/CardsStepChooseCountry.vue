<script>
import CsButton from '../../components/CsButton.vue';
import CsFormSelect from '../../components/CsForm/CsFormSelect.vue';
import CsStep from '../../components/CsStep.vue';
import MainLayout from '../../layouts/MainLayout.vue';

export default {
  components: {
    MainLayout,
    CsFormSelect,
    CsButton,
  },
  extends: CsStep,
  data() {
    return {
      countryCode: this.args.countryCode,
      countries: this.$account.cards.countries,
      error: undefined,
    };
  },
  methods: {
    select() {
      this.error = undefined;
      this.$account.cards.setCountryCode(this.countryCode);
    },
    confirm() {
      const products = this.$account.cards.getProducts(this.countryCode);
      if (products.length) {
        this.next('showcase', { products });
      } else {
        this.error = this.$t('This country/region is currently not supported');
      }
    },
  },
};
</script>

<template>
  <MainLayout :title="$t('Buy card')">
    <CsFormSelect
      v-model="countryCode"
      class="&__select"
      :label="$t('Select your country/region of residence')"
      :options="countries"
      :error="error"
      @update:modelValue="select"
    />
    <CsButton
      type="primary"
      @click="confirm"
    >
      {{ $t('Continue') }}
    </CsButton>
  </MainLayout>
</template>

<style lang="scss">
  .#{ $filename } {
    &__select {
      flex-grow: 1;
    }
  }
</style>
