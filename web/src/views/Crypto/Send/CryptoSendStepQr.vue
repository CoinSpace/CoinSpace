<script>
import CsQrScan from '../../../components/CsQrScan.vue';
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';

import { cryptoSubtitle } from '../../../lib/helpers.js';

export default {
  components: {
    CsQrScan,
    MainLayout,
  },
  extends: CsStep,
  data() {
    return {
      subtitle: cryptoSubtitle(this.$wallet),
    };
  },
};
</script>

<template>
  <MainLayout
    :title="$t('Send {symbol}', { symbol: $wallet.crypto.symbol })"
    :description="subtitle"
  >
    <CsQrScan
      @back="back"
    />
  </MainLayout>
</template>
