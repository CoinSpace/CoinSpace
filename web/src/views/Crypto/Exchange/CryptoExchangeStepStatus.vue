<script>
import CsStep from '../../../components/CsStep.vue';
import CsTransactionStatus from '../../../components/CsTransactionStatus.vue';
import { onShowOnHide } from '../../../lib/mixins.js';

export default {
  components: {
    CsTransactionStatus,
  },
  extends: CsStep,
  mixins: [onShowOnHide],
  onShow() {
    if (this.storage.status === false) {
      this.$wallet.state = this.$STATE_ERROR;
    }
  },
};
</script>

<template>
  <CsTransactionStatus
    :title="$t('Confirm swap')"
    :status="storage.status"
    :message="storage.message"
  />
</template>
