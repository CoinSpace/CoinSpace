<script>
import CsPinStep from '../../../components/CsPinStep.vue';
import CsSteps from '../../../components/CsSteps.vue';

import CryptoReceiveStepAccount from './CryptoReceiveStepAccount.vue';
import CryptoReceiveStepIndex from './CryptoReceiveStepIndex.vue';
import CryptoReceiveStepMoneroAccept from './CryptoReceiveStepMoneroAccept.vue';
import CryptoReceiveStepMoneroStatus from './CryptoReceiveStepMoneroStatus.vue';

export default {
  components: {
    CsSteps,
  },
  steps: {
    index: CryptoReceiveStepIndex,
    account: CryptoReceiveStepAccount,
    moneroAccept: CryptoReceiveStepMoneroAccept,
    pin: CsPinStep,
    moneroStatus: CryptoReceiveStepMoneroStatus,
  },
};
</script>

<template>
  <CsSteps
    :steps="$options.steps"
  />
</template>
