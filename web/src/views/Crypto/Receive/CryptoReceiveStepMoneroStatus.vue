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
