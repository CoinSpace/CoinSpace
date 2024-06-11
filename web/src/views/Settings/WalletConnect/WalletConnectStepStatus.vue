<script>
import CsStep from '../../../components/CsStep.vue';
import CsTransactionStatus from '../../../components/CsTransactionStatus.vue';

const SIGN_REQUESTS = [
  'eth_signTypedData',
  'eth_signTypedData_v4',
  'eth_sign',
  'personal_sign',
];

export default {
  components: {
    CsTransactionStatus,
  },
  extends: CsStep,
  computed: {
    title() {
      if (SIGN_REQUESTS.includes(this.storage.method)) {
        return this.$t('Signature request');
      }
    },
    header() {
      if (SIGN_REQUESTS.includes(this.storage.method)) {
        if (this.storage.status) {
          return this.$t('Signing successful');
        } else {
          return this.$t('Signing failed');
        }
      }
    },
    message() {
      if (SIGN_REQUESTS.includes(this.storage.method)) {
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
