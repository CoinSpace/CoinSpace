<script>
import CsPinStep from '../../../components/CsPinStep.vue';
import CsSteps from '../../../components/CsSteps.vue';

import CryptoHistoryStepAccelerate from './CryptoHistoryStepAccelerate.vue';
import CryptoHistoryStepAccelerateStatus from './CryptoHistoryStepAccelerateStatus.vue';
import CryptoHistoryStepList from './CryptoHistoryStepList.vue';
import CryptoHistoryStepMoneroAccept from './CryptoHistoryStepMoneroAccept.vue';
import CryptoHistoryStepMoneroStatus from './CryptoHistoryStepMoneroStatus.vue';
import CryptoHistoryStepTransaction from './CryptoHistoryStepTransaction.vue';

export default {
  components: {
    CsSteps,
  },
  steps: {
    index: CryptoHistoryStepList,
    accelerate: CryptoHistoryStepAccelerate,
    accelerateStatus: CryptoHistoryStepAccelerateStatus,
    transaction: CryptoHistoryStepTransaction,
    moneroAccept: CryptoHistoryStepMoneroAccept,
    moneroStatus: CryptoHistoryStepMoneroStatus,
    pin: CsPinStep,
  },
};
</script>

<template>
  <CsSteps
    :steps="$options.steps"
  />
</template>
