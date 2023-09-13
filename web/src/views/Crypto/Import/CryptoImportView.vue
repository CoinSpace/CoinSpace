<script>
import CsSteps from '../../../components/CsSteps.vue';

import CryptoImportStepConfirm from './CryptoImportStepConfirm.vue';
import CryptoImportStepMinerFee from './CryptoImportStepMinerFee.vue';
import CryptoImportStepPrivateKey from './CryptoImportStepPrivateKey.vue';
import CryptoImportStepStatus from './CryptoImportStepStatus.vue';

export default {
  components: {
    CsSteps,
  },
  steps: {
    index: CryptoImportStepMinerFee,
    privateKey: CryptoImportStepPrivateKey,
    confirm: CryptoImportStepConfirm,
    status: CryptoImportStepStatus,
  },
};
</script>

<template>
  <CsSteps
    :steps="$options.steps"
  />
</template>
