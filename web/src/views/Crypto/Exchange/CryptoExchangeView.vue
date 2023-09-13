<script>
import CsPinStep from '../../../components/CsPinStep.vue';
import CsSteps from '../../../components/CsSteps.vue';

import CryptoExchangeStepAddress from './CryptoExchangeStepAddress.vue';
import CryptoExchangeStepConfirm from './CryptoExchangeStepConfirm.vue';
import CryptoExchangeStepIndex from './CryptoExchangeStepIndex.vue';
import CryptoExchangeStepMecto from './CryptoExchangeStepMecto.vue';
import CryptoExchangeStepStatus from './CryptoExchangeStepStatus.vue';
import CryptoExchangeStepTarget from './CryptoExchangeStepTarget.vue';

export default {
  components: {
    CsSteps,
  },
  steps: {
    index: CryptoExchangeStepIndex,
    target: CryptoExchangeStepTarget,
    address: CryptoExchangeStepAddress,
    confirm: CryptoExchangeStepConfirm,
    status: CryptoExchangeStepStatus,
    mecto: CryptoExchangeStepMecto,
    pin: CsPinStep,
  },
};
</script>

<template>
  <CsSteps
    :steps="$options.steps"
  />
</template>
