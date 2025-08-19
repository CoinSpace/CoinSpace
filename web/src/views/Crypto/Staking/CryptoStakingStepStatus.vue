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
  methods: {
    done() {
      this.$router.replace({ name: 'crypto.staking', params: { cryptoId: this.$wallet.crypto._id }, force: true });
    },
  },
};
</script>

<template>
  <CsTransactionStatus
    :title="storage.title"
    :status="storage.status"
    @done="done"
  />
</template>
