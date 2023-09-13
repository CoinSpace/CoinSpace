<script>
import CsLoader from '../../../components/CsLoader.vue';
import CsMinerFee from '../../../components/CsMinerFee.vue';
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';

export default {
  components: {
    MainLayout,
    CsLoader,
    CsMinerFee,
  },
  extends: CsStep,
  data() {
    return {
      isLoading: true,
    };
  },
  async mounted() {
    this.isLoading = true;
    if (this.$wallet.isFeeRatesSupported) await this.$wallet.loadFeeRates();
    if (this.$wallet.isFeeRatesSupported && this.$wallet.feeRates.length > 1) {
      this.isLoading = false;
    } else {
      this.updateStorage({
        feeRate: this.$wallet.isFeeRatesSupported ? this.$wallet.feeRates[0] : undefined,
        priceUSD: this.$wallet.isCsFeeSupported ?
          await this.$account.market.getPrice(this.$wallet.crypto._id, 'USD') : undefined,
      });
      this.replace('privateKey');
      this.isLoading = false;
    }
  },
  methods: {
    async confirm(feeRate) {
      this.isLoading = true;
      try {
        this.updateStorage({
          feeRate,
          priceUSD: this.$wallet.isCsFeeSupported ?
            await this.$account.market.getPrice(this.$wallet.crypto._id, 'USD') : undefined,
        });
        this.next('privateKey');
      } catch (err) {
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    },
  },
};
</script>

<template>
  <MainLayout
    :title="$t('Transfer private key')"
  >
    <CsLoader v-if="isLoading" />
    <CsMinerFee
      v-else
      :feeRates="$wallet.feeRates"
      @confirm="confirm"
    />
  </MainLayout>
</template>
