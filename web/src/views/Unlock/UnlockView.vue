<script>
import CsPinStep from '../../components/CsPinStep.vue';
import CsSteps from '../../components/CsSteps.vue';

import UnlockStepDerivation from './UnlockStepDerivation.vue';
import UnlockStepIndex from './UnlockStepIndex.vue';

export default {
  components: {
    CsSteps,
  },
  steps: {
    index: UnlockStepIndex,
    derivation: UnlockStepDerivation,
    pin: CsPinStep,
  },
};
</script>

<template>
  <CsSteps
    :steps="$options.steps"
  />
</template>
