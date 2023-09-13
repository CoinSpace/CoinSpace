<script>
import CsStep from '../../../components/CsStep.vue';
import CsTransactionStatus from '../../../components/CsTransactionStatus.vue';

import * as MoneroErrors from '@coinspace/cs-monero-wallet/errors';

export default {
  components: {
    CsTransactionStatus,
  },
  extends: CsStep,
  computed: {
    message() {
      if (this.storage.status === false) {
        if (this.storage.error instanceof MoneroErrors.NotYourTransactionError) {
          return this.$t("Not your transaction. It can't be accepted.");
        }
        if (this.storage.error instanceof MoneroErrors.InvalidTransactionIDError) {
          return this.$t('Invalid transaction ID');
        }
        if (this.storage.error instanceof MoneroErrors.TransactionAlreadyAddedError) {
          return this.$t('Transaction has already been accepted');
        }
        if (this.storage.error instanceof MoneroErrors.UnknownTransactionError) {
          // eslint-disable-next-line max-len
          return this.$t('Transaction not found or has less than 10 confirmations. Please wait 20 minutes and try again.');
        }
        return this.$t('Error! Please try again later.');
      }
    },
  },
};
</script>

<template>
  <CsTransactionStatus
    :title="$t('Accept transaction')"
    :header="storage.status ? $t('Transaction accepted') : $t('Failed')"
    :status="storage.status"
    :message="message"
  />
</template>
