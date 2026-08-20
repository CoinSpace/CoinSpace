<script>
import CsButton from '../../components/CsButton.vue';
import CsFormDatepicker from '../../components/CsForm/CsFormDatepicker.vue';
import CsFormFilepicker from '../../components/CsForm/CsFormFilepicker.vue';
import CsFormGroup from '../../components/CsForm/CsFormGroup.vue';
import CsFormInput from '../../components/CsForm/CsFormInput.vue';
import CsFormSelect from '../../components/CsForm/CsFormSelect.vue';
import CsStep from '../../components/CsStep.vue';
import MainLayout from '../../layouts/MainLayout.vue';

export default {
  components: {
    MainLayout,
    CsButton,
    CsFormDatepicker,
    CsFormFilepicker,
    CsFormGroup,
    CsFormInput,
    CsFormSelect,
  },
  extends: CsStep,
  data() {
    const { $t } = this;
    return {
      errors: {},
      documentType: this.storage.kyc.documentType,
      documentTypes: [{
        name: $t('National ID'),
        value: '1',
      }, {
        name: $t('Passport'),
        value: '2',
      }, {
        name: $t('Residence Permit'),
        value: '3',
      }],
      documentNumber: this.storage.kyc.documentNumber,
      countries: this.$account.cards.countries,
      documentCountry: this.storage.kyc.documentCountry || this.storage.kyc.country,
      documentExpiryDate: this.storage.kyc.documentExpiryDate,
      documentFront: this.storage.kyc.documentFront,
      documentBack: this.storage.kyc.documentBack,
      fileMaxSize: 1 * 1024 * 1024,
      photoMinEdge: 300,
    };
  },
  methods: {
    confirm() {
      if (!this.documentType) {
        return this.errors.documentType = this.$t('Invalid value');
      }
      if (!this.documentNumber) {
        return this.errors.documentNumber = this.$t('Invalid value');
      }
      if (!this.documentCountry) {
        return this.errors.documentCountry = this.$t('Invalid value');
      }
      if (!this.documentExpiryDate) {
        return this.errors.documentExpiryDate = this.$t('Invalid value');
      }
      if (!this.documentFront) {
        return this.errors.documentFront = this.$t('Invalid photo');
      } else if (this.documentFront.photoMinEdge < this.photoMinEdge) {
        return this.errors.documentFront = this.$t('Photo is too small. Minimum {size}px side.', { size: '300' });
      } else if (this.documentFront.size > this.fileMaxSize) {
        return this.errors.documentFront = this.$t('Photo is too large. Maximum {size} MB.', { size: '1' });
      }
      if (!this.documentBack) {
        return this.errors.documentBack = this.$t('Invalid photo');
      } else if (this.documentBack.photoMinEdge < this.photoMinEdge) {
        return this.errors.documentBack = this.$t('Photo is too small. Minimum {size}px side.', { size: '300' });
      } else if (this.documentBack.size > this.fileMaxSize) {
        return this.errors.documentBack = this.$t('Photo is too large. Maximum {size} MB.', { size: '1' });
      }
      this.updateStorage({
        kyc: {
          ...this.storage.kyc,
          documentType: this.documentType,
          documentNumber: this.documentNumber,
          documentCountry: this.documentCountry,
          documentExpiryDate: this.documentExpiryDate,
          documentFront: this.documentFront,
          documentBack: this.documentBack,
        },
      });
      this.next('kycAdditional');
    },
    selectDocumentCountry() {
      this.errors.documentCountry = undefined;
      this.$account.cards.setCountryCode(this.documentCountry);
    },
  },
};
</script>

<template>
  <MainLayout
    :title="$t('KYC')"
    :description="$t('Document')"
  >
    <CsFormGroup class="&__content">
      <CsFormSelect
        v-model="documentType"
        :label="$t('Document type')"
        :options="documentTypes"
        :error="errors.documentType"
        @update:modelValue="errors.documentType = undefined"
      />
      <CsFormInput
        v-model="documentNumber"
        :label="$t('Document number')"
        :clear="true"
        :error="errors.documentNumber"
        @update:modelValue="errors.documentNumber = undefined"
      />
      <CsFormSelect
        v-model="documentCountry"
        :label="$t('Document issuing country/region')"
        :options="countries"
        :error="errors.documentCountry"
        @update:modelValue="selectDocumentCountry"
      />
      <CsFormDatepicker
        v-model="documentExpiryDate"
        :label="$t('Document expiry date')"
        :error="errors.documentExpiryDate"
        :minYear="(new Date()).getFullYear()"
        :maxYear="(new Date()).getFullYear() + 20"
        @update:modelValue="errors.documentExpiryDate = undefined"
      />
      <CsFormFilepicker
        v-model="documentFront"
        :label="$t('Front side of the document')"
        :placeholder="$t('Select photo...')"
        :fileMaxSize="fileMaxSize"
        :photoMinEdge="photoMinEdge"
        :error="errors.documentFront"
        :clear="true"
        @update:modelValue="errors.documentFront = undefined"
      />
      <CsFormFilepicker
        v-model="documentBack"
        :label="$t('Back side of the document')"
        :placeholder="$t('Select photo...')"
        :fileMaxSize="fileMaxSize"
        :photoMinEdge="photoMinEdge"
        :error="errors.documentBack"
        :clear="true"
        @update:modelValue="errors.documentBack = undefined"
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
