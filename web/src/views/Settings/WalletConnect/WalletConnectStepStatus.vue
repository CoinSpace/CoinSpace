<script>
import CsStep from '../../../components/CsStep.vue';
import CsTransactionStatus from '../../../components/CsTransactionStatus.vue';

export default {
  components: {
    CsTransactionStatus,
  },
  extends: CsStep,
  computed: {
    title() {
      if (this.storage.type === 'sign') {
        return this.$t('Signature request');
      }
    },
    header() {
      if (this.storage.type === 'sign') {
        if (this.storage.status) {
          return this.$t('Signing successful');
        } else {
          return this.$t('Signing failed');
        }
      }
    },
    message() {
      if (this.storage.type === 'sign') {
        if (this.storage.status) {
          return this.$t('Message has been signed.');
        } else {
          return this.$t('Please try again later.');
        }
      }
    },
  },
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
    :title="title"
    :header="header"
    :message="message"
    @done="done"
  />
</template>
