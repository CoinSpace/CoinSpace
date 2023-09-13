<script>
import CsPinStep from '../../../components/CsPinStep.vue';
import CsSteps from '../../../components/CsSteps.vue';

import SettingsPinStepIndex from './SettingsPinStepIndex.vue';

export default {
  components: {
    CsSteps,
  },
  steps: {
    index: SettingsPinStepIndex,
    pin: CsPinStep,
  },
};
</script>

<template>
  <CsSteps
    :steps="$options.steps"
  />
</template>
