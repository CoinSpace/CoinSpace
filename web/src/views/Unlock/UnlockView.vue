<script>
import CsPinStep from '../../components/CsPinStep.vue';
import CsSteps from '../../components/CsSteps.vue';

import UnlockStepIndex from './UnlockStepIndex.vue';
import UnlockStepNewCryptos from './UnlockStepNewCryptos.vue';
import UnlockStepSynchronization from './UnlockStepSynchronization.vue';

export default {
  components: {
    CsSteps,
  },
  steps: {
    index: UnlockStepIndex,
    synchronization: UnlockStepSynchronization,
    new: UnlockStepNewCryptos,
    pin: CsPinStep,
  },
};
</script>

<template>
  <CsSteps
    :steps="$options.steps"
  />
</template>
