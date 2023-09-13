<script>
import CsPinStep from '../../../components/CsPinStep.vue';
import CsSteps from '../../../components/CsSteps.vue';

import SettingsHardwareStepIndex from './SettingsHardwareStepIndex.vue';
import SettingsHardwareStepPassphrase from './SettingsHardwareStepPassphrase.vue';

export default {
  components: {
    CsSteps,
  },
  steps: {
    index: SettingsHardwareStepIndex,
    pin: CsPinStep,
    passphrase: SettingsHardwareStepPassphrase,
  },
};
</script>

<template>
  <CsSteps
    :steps="$options.steps"
  />
</template>
