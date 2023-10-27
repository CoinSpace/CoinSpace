<script>
import { cryptoSubtitle } from '../../../lib/helpers.js';

import CsPoor from '../../../components/CsPoor.vue';
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';

export default {
  components: {
    MainLayout,
    CsPoor,
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
    <CsPoor />
  </MainLayout>
</template>
