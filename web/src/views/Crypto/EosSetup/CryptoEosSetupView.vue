<script>
import CsSteps from '../../../components/CsSteps.vue';

import CryptoEosSetupStepConfirm from './CryptoEosSetupStepConfirm.vue';
import CryptoEosSetupStepIndex from './CryptoEosSetupStepIndex.vue';

export default {
  components: {
    CsSteps,
  },
  steps: {
    index: CryptoEosSetupStepIndex,
    confirm: CryptoEosSetupStepConfirm,
  },
};
</script>

<template>
  <CsSteps
    :steps="$options.steps"
  />
</template>
