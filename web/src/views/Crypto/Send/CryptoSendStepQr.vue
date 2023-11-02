<script>
import CsQrScan from '../../../components/CsQrScan.vue';
import CsQrScanPhonegap from '../../../components/CsQrScanPhonegap.vue';
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';

export default {
  components: {
    CsQrScan,
    CsQrScanPhonegap,
    MainLayout,
  },
  extends: CsStep,
};
</script>

<template>
  <MainLayout
    :title="$t('Scan QR')"
  >
    <component
      :is="env.VITE_BUILD_TYPE === 'phonegap' ? 'CsQrScanPhonegap' : 'CsQrScan'"
      @back="back"
    />
  </MainLayout>
</template>
