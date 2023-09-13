<script>
import CsMinerFee from '../../../components/CsMinerFee.vue';
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';

import { cryptoSubtitle } from '../../../lib/helpers.js';

export default {
  components: {
    MainLayout,
    CsMinerFee,
  },
  extends: CsStep,
  data() {
    return {
      subtitle: cryptoSubtitle(this.$wallet),
    };
  },
  methods: {
    confirm(feeRate) {
      this.updateStorage({ feeRate });
      this.next('amount');
    },
  },
};
</script>

<template>
  <MainLayout
    :title="$t('Send {symbol}', { symbol: $wallet.crypto.symbol })"
    :description="subtitle"
  >
    <CsMinerFee
      :feeRates="$wallet.feeRates"
      @confirm="confirm"
    />
  </MainLayout>
</template>
