<script>
import CsStep from '../../../components/CsStep.vue';
import CsTransactionStatus from '../../../components/CsTransactionStatus.vue';

export default {
  components: {
    CsTransactionStatus,
  },
  extends: CsStep,
};
</script>

<template>
  <CsTransactionStatus
    :title="$t('Accelerate')"
    :header="storage.status ? $t('Acceleration successful') : $t('Acceleration failed')"
    :status="storage.status"
    :message="storage.message"
    :action="storage.action"
  />
</template>
