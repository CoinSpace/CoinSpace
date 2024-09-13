<script>
import CsStep from '../../../components/CsStep.vue';
import CsTransactionStatus from '../../../components/CsTransactionStatus.vue';

export default {
  components: {
    CsTransactionStatus,
  },
  extends: CsStep,
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
