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
    if (this.storage.status && ['ios', 'android-play'].includes(this.env.VITE_DISTRIBUTION)) {
      window.cordova.plugins.AppReview.requestReview().catch(() => {});
    }
  },
};
</script>

<template>
  <CsTransactionStatus
    :status="storage.status"
    :message="storage.message"
  />
</template>
