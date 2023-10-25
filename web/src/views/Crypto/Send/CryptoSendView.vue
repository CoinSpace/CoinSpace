<script>
import CsPinStep from '../../../components/CsPinStep.vue';
import CsSteps from '../../../components/CsSteps.vue';

import CryptoSendStepAddress from './CryptoSendStepAddress.vue';
import CryptoSendStepAmount from './CryptoSendStepAmount.vue';
import CryptoSendStepConfirm from './CryptoSendStepConfirm.vue';
import CryptoSendStepGas from './CryptoSendStepGas.vue';
import CryptoSendStepMecto from './CryptoSendStepMecto.vue';
import CryptoSendStepMeta from './CryptoSendStepMeta.vue';
import CryptoSendStepMinerFee from './CryptoSendStepMinerFee.vue';
import CryptoSendStepQr from './CryptoSendStepQr.vue';
import CryptoSendStepStatus from './CryptoSendStepStatus.vue';

export default {
  components: {
    CsSteps,
  },
  steps: {
    index: CryptoSendStepAddress,
    meta: CryptoSendStepMeta,
    fee: CryptoSendStepMinerFee,
    gas: CryptoSendStepGas,
    amount: CryptoSendStepAmount,
    confirm: CryptoSendStepConfirm,
    status: CryptoSendStepStatus,
    mecto: CryptoSendStepMecto,
    pin: CsPinStep,
    qr: CryptoSendStepQr,
  },
  beforeRouteUpdate() {
    this.$refs.steps.clear();
  },
};
</script>

<template>
  <CsSteps
    ref="steps"
    :steps="$options.steps"
  />
</template>
