<script>
import CsStep from '../../components/CsStep.vue';
import CsTransactionStatus from '../../components/CsTransactionStatus.vue';

import { BuyDisabledError, TopupDisabledError } from '../../lib/account/Cards.js';

export default {
  components: {
    CsTransactionStatus,
  },
  extends: CsStep,
  computed: {
    title() {
      if (this.storage.cardAction === 'topup') {
        return this.$t('Confirm top-up');
      }
      if (this.storage.cardAction === 'kyc') {
        return this.$t('KYC');
      }
    },
    header() {
      if (this.storage.cardAction === 'kyc') {
        if (this.storage.status) {
          return this.$t('Submission successful');
        } else {
          return this.$t('Submission failed');
        }
      }
    },
    message() {
      if (this.storage.status) {
        if (this.storage.cardAction === 'kyc') {
          return this.$t('Your submission is being reviewed. We will notify you by email once the review is complete.');
        }
      } else {
        if (this.storage.error instanceof TopupDisabledError) {
          return this.$t('Card top-up is temporarily unavailable.');
        }
        if (this.storage.error instanceof BuyDisabledError) {
          return this.$t('Card issuance has been temporarily suspended.');
        }
        console.error(this.storage.error);
        return this.$account.unknownError();
      }
    },
    action() {
      if (this.storage.status === false) {
        if (this.storage.error instanceof BuyDisabledError
          || this.storage.error instanceof TopupDisabledError) {
          return this.$t('Back');
        }
      }
    },
  },
  methods: {
    done() {
      if (['kyc', 'buy'].includes(this.storage.cardAction)) {
        this.$router.replace({ name: 'cards', force: true });
      } else {
        this.backTo('card');
      }
    },
  },
};
</script>

<template>
  <CsTransactionStatus
    :status="storage.status"
    :title="title"
    :header="header"
    :message="message"
    :action="action"
    @done="done"
  />
</template>
