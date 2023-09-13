<script>
import AuthStepLayout from '../layouts/AuthStepLayout.vue';
import MainLayout from '../layouts/MainLayout.vue';

import CsPin from './CsPin.vue';
import CsStep from './CsStep.vue';

export default {
  components: {
    AuthStepLayout,
    CsPin,
    MainLayout,
  },
  extends: CsStep,
};
</script>

<template>
  <component
    :is="args.layout"
    :title="$t('Enter your PIN')"
  >
    <CsPin
      :mode="args.mode"
      @success="args.success"
    />
  </component>
</template>
