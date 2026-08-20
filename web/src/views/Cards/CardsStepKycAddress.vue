<script>
import CsButton from '../../components/CsButton.vue';
import CsFormGroup from '../../components/CsForm/CsFormGroup.vue';
import CsFormInput from '../../components/CsForm/CsFormInput.vue';
import CsFormSelect from '../../components/CsForm/CsFormSelect.vue';
import CsStep from '../../components/CsStep.vue';
import MainLayout from '../../layouts/MainLayout.vue';

export default {
  components: {
    MainLayout,
    CsButton,
    CsFormGroup,
    CsFormInput,
    CsFormSelect,
  },
  extends: CsStep,
  data() {
    return {
      errors: {},
      country: this.args.countryCode,
      countries: this.$account.cards.countries,
      city: this.storage.kyc.city,
      postCode: this.storage.kyc.postCode,
      address: this.storage.kyc.address,
    };
  },
  methods: {
    confirm() {
      if (!this.country) {
        return this.errors.country = this.$t('Invalid value');
      }
      if (!this.city) {
        return this.errors.city = this.$t('Invalid value');
      }
      if (!this.postCode) {
        return this.errors.postCode = this.$t('Invalid value');
      }
      if (!this.address) {
        return this.errors.address = this.$t('Invalid value');
      }
      this.updateStorage({
        kyc: {
          ...this.storage.kyc,
          country: this.country,
          city: this.city,
          postCode: this.postCode,
          address: this.address,
        },
      });
      this.next('kycDocument');
    },
    select() {
      this.errors.country = undefined;
      this.$account.cards.setCountryCode(this.country);
    },
  },
};
</script>

<template>
  <MainLayout
    :title="$t('KYC')"
    :description="$t('Address')"
  >
    <CsFormGroup class="&__content">
      <CsFormSelect
        v-model="country"
        :label="$t('Country/region')"
        :options="countries"
        :error="errors.country"
        @update:modelValue="select"
      />
      <CsFormInput
        v-model="city"
        :label="$t('City')"
        :clear="true"
        :error="errors.city"
        @update:modelValue="errors.city = undefined"
      />
      <CsFormInput
        v-model="postCode"
        :label="$t('Post code')"
        :clear="true"
        :error="errors.postCode"
        @update:modelValue="errors.postCode = undefined"
      />
      <CsFormInput
        v-model="address"
        :label="$t('Address')"
        :clear="true"
        :error="errors.address"
        @update:modelValue="errors.address = undefined"
      />
    </CsFormGroup>

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
    $self: &;

    &__content {
      flex-grow: 1;
    }
  }
</style>
