<script>
import CsPinStep from '../../../components/CsPinStep.vue';
import CsSteps from '../../../components/CsSteps.vue';

import CryptoAddStepCustomToken from './CryptoAddStepCustomToken.vue';
import CryptoAddStepFilterBlockchain from './CryptoAddStepFilterBlockchain.vue';
import CryptoAddStepIndex from './CryptoAddStepIndex.vue';
import CryptoAddStepQr from './CryptoAddStepQr.vue';
import CryptoAddStepSelectBlockchain from './CryptoAddStepSelectBlockchain.vue';
import CryptoAddStepTokenInfo from './CryptoAddStepTokenInfo.vue';

export default {
  components: {
    CsSteps,
  },
  beforeRouteUpdate() {
    this.stepsKey++;
  },
  data() {
    return {
      stepsKey: 0,
    };
  },
  steps: {
    index: CryptoAddStepIndex,
    customToken: CryptoAddStepCustomToken,
    selectBlockchain: CryptoAddStepSelectBlockchain,
    filterBlockchain: CryptoAddStepFilterBlockchain,
    tokenInfo: CryptoAddStepTokenInfo,
    qr: CryptoAddStepQr,
    pin: CsPinStep,
  },
};
</script>

<template>
  <CsSteps
    :key="stepsKey"
    :steps="$options.steps"
    :initialStorage="{ platform: 'ethereum@ethereum' }"
  />
</template>
