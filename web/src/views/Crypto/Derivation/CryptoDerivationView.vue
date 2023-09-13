<script>
import CsPinStep from '../../../components/CsPinStep.vue';
import CsSteps from '../../../components/CsSteps.vue';

import CryptoDerivationStepIndex from './CryptoDerivationStepIndex.vue';

export default {
  components: {
    CsSteps,
  },
  steps: {
    index: CryptoDerivationStepIndex,
    pin: CsPinStep,
  },
};
</script>

<template>
  <CsSteps
    :steps="$options.steps"
  />
</template>
