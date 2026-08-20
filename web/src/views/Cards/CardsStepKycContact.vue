<script>
import CsButton from '../../components/CsButton.vue';
import CsFormGroup from '../../components/CsForm/CsFormGroup.vue';
import CsFormInput from '../../components/CsForm/CsFormInput.vue';
import CsStep from '../../components/CsStep.vue';
import MainLayout from '../../layouts/MainLayout.vue';
import { isValidEmail } from '../../lib/helpers.js';

export default {
  components: {
    MainLayout,
    CsButton,
    CsFormGroup,
    CsFormInput,
  },
  extends: CsStep,
  data() {
    return {
      isLoading: false,
      errors: {},
      email: this.storage.kyc.email,
      phone: `+${this.storage.kyc.phoneAreaCode || ''} ${this.storage.kyc.phoneNumber || ''}`.trim(),
    };
  },
  methods: {
    async confirm() {
      this.isLoading = true;
      try {
        if (!isValidEmail(this.email)) {
          return this.errors.email = this.$t('Invalid email');
        }

        const parsePhoneNumber = (await import('libphonenumber-js')).default;
        const phoneNumber = parsePhoneNumber(this.phone);
        if (!phoneNumber) {
          return this.errors.phone = this.$t('Invalid value');
        }
        this.updateStorage({
          kyc: {
            ...this.storage.kyc,
            email: this.email,
            phoneNumber: phoneNumber.nationalNumber,
            phoneAreaCode: phoneNumber.countryCallingCode,
          },
        });
        const countryCode = await this.$account.cards.getCountryCode();
        this.next('kycAddress', { countryCode });
      } catch (err) {
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
    :title="$t('KYC')"
    :description="$t('Contact information')"
  >
    <CsFormGroup class="&__content">
      <CsFormInput
        v-model="email"
        :label="$t('Email address')"
        :clear="true"
        inputmode="email"
        :error="errors.email"
        @update:modelValue="errors.email = undefined"
      />
      <CsFormInput
        v-model="phone"
        :label="$t('Phone number')"
        :clear="true"
        :error="errors.phone"
        inputmode="numeric"
        @update:modelValue="errors.phone = undefined"
      />
    </CsFormGroup>

    <CsButton
      type="primary"
      :isLoading="isLoading"
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
