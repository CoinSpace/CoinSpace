<script>
import CsPinStep from '../../../components/CsPinStep.vue';
import CsSteps from '../../../components/CsSteps.vue';

import CryptoStakingStepConfirm from './CryptoStakingStepConfirm.vue';
import CryptoStakingStepIndex from './CryptoStakingStepIndex.vue';
import CryptoStakingStepPendingRequests from './CryptoStakingStepPendingRequests.vue';
import CryptoStakingStepPoor from './CryptoStakingStepPoor.vue';
import CryptoStakingStepStake from './CryptoStakingStepStake.vue';
import CryptoStakingStepStatus from './CryptoStakingStepStatus.vue';
import CryptoStakingStepUnstake from './CryptoStakingStepUnstake.vue';

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
    index: CryptoStakingStepIndex,
    stake: CryptoStakingStepStake,
    unstake: CryptoStakingStepUnstake,
    pendingRequests: CryptoStakingStepPendingRequests,
    confirm: CryptoStakingStepConfirm,
    status: CryptoStakingStepStatus,
    poor: CryptoStakingStepPoor,
    pin: CsPinStep,
  },
};
</script>

<template>
  <CsSteps
    :key="stepsKey"
    :steps="$options.steps"
  />
</template>
