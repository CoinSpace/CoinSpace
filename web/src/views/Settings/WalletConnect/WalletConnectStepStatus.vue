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
      this.back();
    },
  },
};
</script>

<template>
  <CsTransactionStatus
    :transaction="storage.transaction"
    :status="storage.status"
    :title="storage.title"
    :header="storage.header"
    :message="storage.message"
    @done="done"
  />
</template>
