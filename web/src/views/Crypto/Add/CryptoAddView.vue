<script>
import CsPinStep from '../../../components/CsPinStep.vue';
import CsSteps from '../../../components/CsSteps.vue';

import CryptoAddStepCustomToken from './CryptoAddStepCustomToken.vue';
import CryptoAddStepIndex from './CryptoAddStepIndex.vue';
import CryptoAddStepSelectBlockchain from './CryptoAddStepSelectBlockchain.vue';

export default {
  components: {
    CsSteps,
  },
  steps: {
    index: CryptoAddStepIndex,
    customToken: CryptoAddStepCustomToken,
    selectBlockchain: CryptoAddStepSelectBlockchain,
    pin: CsPinStep,
  },
};
</script>

<template>
  <CsSteps
    :steps="$options.steps"
  />
</template>
