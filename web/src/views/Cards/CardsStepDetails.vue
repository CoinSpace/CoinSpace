<script>
import CsFormGroup from '../../components/CsForm/CsFormGroup.vue';
import CsFormTextareaReadonly from '../../components/CsForm/CsFormTextareaReadonly.vue';
import CsStep from '../../components/CsStep.vue';
import MainLayout from '../../layouts/MainLayout.vue';

export default {
  components: {
    MainLayout,
    CsFormGroup,
    CsFormTextareaReadonly,
  },
  extends: CsStep,
};
</script>

<template>
  <MainLayout :title="$t('Card details')">
    <CsFormGroup>
      <CsFormTextareaReadonly
        :label="$t('Cardholder name')"
        :value="args.cardholderName"
        copy
      />
      <CsFormTextareaReadonly
        :label="$t('Card number')"
        :value="args.cardNumber.match(/.{1,4}/g).join(' ')"
        :copyValue="args.cardNumber"
        copy
      />
      <CsFormTextareaReadonly
        :label="$t('Expiry date')"
        :value="args.expiryDate"
        copy
      />
      <CsFormTextareaReadonly
        :label="$t('Security code')"
        :value="args.securityCode"
        copy
      />
    </CsFormGroup>
  </MainLayout>
</template>
