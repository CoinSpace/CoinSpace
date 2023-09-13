<script>
import CsStep from '../../../components/CsStep.vue';
import CsTransactionConfirm from '../../../components/CsTransactionConfirm.vue';
import MainLayout from '../../../layouts/MainLayout.vue';
import { walletSeed } from '../../../lib/mixins.js';

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
          const exchange = await this.$account.exchange.createExchange({
            from: this.$wallet.crypto._id,
            to: this.storage.to.crypto._id,
            amount: this.storage.amount,
            address: this.storage.address === 'your wallet'
              ? this.$account.wallet(this.storage.to.crypto._id).address
              : this.storage.address,
            refundAddress: this.$wallet.address,
          });

          const options = {
            address: exchange.depositAddress,
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
          await this.$account.exchange.saveExchange({
            from: this.$wallet.crypto._id,
            to: this.storage.to.crypto._id,
            transactionId: id,
            exchangeId: exchange.id,
            internal: this.storage.address === 'your wallet',
          });
        } catch (err) {
          console.error(err);
          this.updateStorage({ status: false });
        }
        this.next('status');
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
      powered="changelly"
      :isLoading="isLoading"
      @confirm="confirm"
    />
  </MainLayout>
</template>
