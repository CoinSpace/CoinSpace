<script>
import CsButton from '../../components/CsButton.vue';
import CsFormDatepicker from '../../components/CsForm/CsFormDatepicker.vue';
import CsFormGroup from '../../components/CsForm/CsFormGroup.vue';
import CsFormInput from '../../components/CsForm/CsFormInput.vue';
import CsStep from '../../components/CsStep.vue';
import MainLayout from '../../layouts/MainLayout.vue';

export default {
  components: {
    MainLayout,
    CsButton,
    CsFormDatepicker,
    CsFormGroup,
    CsFormInput,
  },
  extends: CsStep,
  data() {
    return {
      errors: {},
      firstName: this.storage.kyc.firstName,
      lastName: this.storage.kyc.lastName,
      dateOfBirth: this.storage.kyc.dateOfBirth,
    };
  },
  methods: {
    confirm() {
      if (!this.firstName) {
        return this.errors.firstName = this.$t('Invalid value');
      }
      if (!this.lastName) {
        return this.errors.lastName = this.$t('Invalid value');
      }
      if (!this.dateOfBirth) {
        return this.errors.dateOfBirth = this.$t('Invalid value');
      }
      this.updateStorage({
        kyc: {
          ...this.storage.kyc,
          firstName: this.firstName,
          lastName: this.lastName,
          dateOfBirth: this.dateOfBirth,
        },
      });
      this.next('kycContact');
    },
  },
};
</script>

<template>
  <MainLayout
    :title="$t('KYC')"
    :description="$t('Personal information')"
  >
    <CsFormGroup class="&__content">
      <CsFormInput
        v-model="firstName"
        :label="$t('First name')"
        :clear="true"
        :error="errors.firstName"
        @update:modelValue="errors.firstName = undefined"
      />
      <CsFormInput
        v-model="lastName"
        :label="$t('Last name')"
        :clear="true"
        :error="errors.lastName"
        @update:modelValue="errors.lastName = undefined"
      />
      <CsFormDatepicker
        v-model="dateOfBirth"
        :label="$t('Date of birth')"
        :error="errors.dateOfBirth"
        @update:modelValue="errors.dateOfBirth = undefined"
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
