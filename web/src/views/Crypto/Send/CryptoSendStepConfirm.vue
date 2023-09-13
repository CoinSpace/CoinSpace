<script>
import CsStep from '../../../components/CsStep.vue';
import CsTransactionConfirm from '../../../components/CsTransactionConfirm.vue';
import MainLayout from '../../../layouts/MainLayout.vue';
import { errors } from '@coinspace/cs-common';
import { walletSeed } from '../../../lib/mixins.js';

import * as RippleErrors from '@coinspace/cs-ripple-wallet/errors';

export default {
  components: {
    MainLayout,
    CsTransactionConfirm,
  },
  extends: CsStep,
  mixins: [walletSeed],
  data() {
    return {
      isLoading: false,
    };
  },
  methods: {
    async confirm() {
      this.isLoading = true;
      await this.walletSeed(async (walletSeed) => {
        try {
          await this.$wallet.createTransaction({
            address: this.storage.address,
            amount: this.storage.amount,
            feeRate: this.storage.feeRate,
            gasLimit: this.storage.gasLimit,
            meta: this.storage.meta,
            price: this.storage.priceUSD,
          }, walletSeed);
          this.$account.emit('update');
          this.updateStorage({ status: true });
        } catch (err) {
          if (err instanceof RippleErrors.DestinationTagNeededError) {
            this.updateStorage({ status: false, message: this.$t("Recipient's wallet requires a destination tag.") });
            return;
          }
          if (err instanceof errors.MinimumReserveDestinationError) {
            this.updateStorage({
              status: false,
              message: this.$t('Value is too small for this destination address, minimum {amount} {symbol}', {
                amount: err.amount,
                symbol: this.$wallet.crypto.symbol,
              }),
            });
            return;
          }
          this.updateStorage({ status: false });
          console.error(err);
        }
        this.next('status');
      });
      this.isLoading = false;
    },
  },
};
</script>

<template>
  <MainLayout :title="$t('Confirm transaction')">
    <CsTransactionConfirm
      :transaction="storage"
      :isLoading="isLoading"
      @confirm="confirm"
    />
  </MainLayout>
</template>
