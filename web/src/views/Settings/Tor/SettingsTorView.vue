<script>
import CsSteps from '../../../components/CsSteps.vue';

import SettingsTorStepIndex from './SettingsTorStepIndex.vue';

export default {
  components: {
    CsSteps,
  },
  steps: {
    index: SettingsTorStepIndex,
  },
};
</script>

<template>
  <CsSteps
    :steps="$options.steps"
  />
</template>
