<script>
import CsStep from '../../../components/CsStep.vue';
import CsTransactionConfirm from '../../../components/CsTransactionConfirm.vue';
import MainLayout from '../../../layouts/MainLayout.vue';
import { errors } from '@coinspace/cs-common';
import { walletSeed } from '../../../lib/mixins.js';

import * as EOSErrors from '@coinspace/cs-eos-wallet/errors';
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
          if (err instanceof EOSErrors.DestinationAcountError) {
            this.updateStorage({ status: false, message: this.$t("Destination account doesn't exist.") });
            return;
          }
          if (err instanceof EOSErrors.ExpiredTransactionError) {
            this.updateStorage({ status: false, message: this.$t('Transaction has been expired. Please try again.') });
            return;
          }
          if (err instanceof EOSErrors.CPUExceededError) {
            this.updateStorage({
              status: false,
              // eslint-disable-next-line max-len
              message: this.$t('Account CPU usage has been exceeded. Please try again later or ask someone to stake you more CPU.'),
            });
            return;
          }
          if (err instanceof EOSErrors.NETExceededError) {
            this.updateStorage({
              status: false,
              // eslint-disable-next-line max-len
              message: this.$t('Account NET usage has been exceeded. Please try again later or ask someone to stake you more NET.'),
            });
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
        } finally {
          this.next('status');
        }
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
