<script>
import CsPinStep from '../../../components/CsPinStep.vue';
import CsSteps from '../../../components/CsSteps.vue';

import SettingsAccountStepIndex from './SettingsAccountStepIndex.vue';
import SettingsAccountStepRemove from './SettingsAccountStepRemove.vue';

export default {
  components: {
    CsSteps,
  },
  steps: {
    index: SettingsAccountStepIndex,
    remove: SettingsAccountStepRemove,
    pin: CsPinStep,
  },
};
</script>

<template>
  <CsSteps
    :steps="$options.steps"
  />
</template>
