<script>
import CsPinStep from '../../../components/CsPinStep.vue';
import CsSteps from '../../../components/CsSteps.vue';

import CryptoExportStepIndex from './CryptoExportStepIndex.vue';
import CryptoExportStepShow from './CryptoExportStepShow.vue';

export default {
  components: {
    CsSteps,
  },
  steps: {
    index: CryptoExportStepIndex,
    pin: CsPinStep,
    show: CryptoExportStepShow,
  },
};
</script>

<template>
  <CsSteps
    :steps="$options.steps"
  />
</template>
