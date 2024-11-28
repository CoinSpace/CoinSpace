<script>
import CsStep from '../../../components/CsStep.vue';
import CsTransactionConfirm from '../../../components/CsTransactionConfirm.vue';
import MainLayout from '../../../layouts/MainLayout.vue';

import { walletSeed } from '../../../lib/mixins.js';
import BaseExchange, {
  InternalExchangeError,
} from '../../../lib/exchanges/BaseExchange.js';

import * as EOSErrors from '@coinspace/cs-eos-wallet/errors';

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
          const exchange = await this.$account.exchanges.createExchange({
            provider: this.storage.provider,
            from: this.$wallet.crypto._id,
            to: this.storage.to.crypto._id,
            amount: this.storage.amount,
            address: this.storage.address === 'your wallet'
              ? this.$account.wallet(this.storage.to.crypto._id).address
              : this.storage.address,
            extraId: (this.storage.address !== 'your wallet'
              && BaseExchange.EXTRA_ID.includes(this.storage.to.crypto._id))
              ? this.storage.extraId : undefined,
            refundAddress: this.$wallet.address,
          });
          let { depositAddress } = exchange;
          if (this.$wallet.isUnaliasSupported) {
            const data = await this.$wallet.unalias(depositAddress);
            if (data) depositAddress = data.address;
          }
          const options = {
            address: depositAddress,
            amount: this.storage.amount,
            price: this.storage.priceUSD,
          };
          if (this.$wallet.isFeeRatesSupported) {
            options.feeRate = this.$wallet.feeRates[0];
          }
          if (this.$wallet.isGasLimitSupported) {
            options.gasLimit = this.$wallet.gasLimit;
          }
          if (this.$wallet.crypto._id === 'xrp@ripple') {
            options.meta = { destinationTag: exchange.extraId };
          }
          if (this.$wallet.crypto._id === 'stellar@stellar') {
            options.meta = { memo: exchange.extraId };
          }
          if (this.$wallet.crypto._id === 'eos@eos') {
            options.meta = { memo: exchange.extraId };
          }
          const id = await this.$wallet.createTransaction(options, walletSeed);
          this.$account.emit('update');
          this.updateStorage({ status: true });
          await this.$account.exchanges.saveExchange({
            provider: this.storage.provider,
            from: this.$wallet.crypto._id,
            to: this.storage.to.crypto._id,
            transactionId: id,
            exchangeId: exchange.id,
            internal: this.storage.address === 'your wallet',
          });
        } catch (err) {
          if (err instanceof InternalExchangeError) {
            this.updateStorage({ status: false, message: this.$t('{exchange} error. Please try again later.', {
              exchange: this.$account.exchanges.getProviderName(this.storage.provider),
            }) });
            return;
          }
          if (err instanceof EOSErrors.DestinationAccountError) {
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
  <MainLayout :title="$t('Confirm exchange')">
    <CsTransactionConfirm
      :transaction="storage"
      :powered="storage.provider"
      :isLoading="isLoading"
      @confirm="confirm"
    />
  </MainLayout>
</template>
