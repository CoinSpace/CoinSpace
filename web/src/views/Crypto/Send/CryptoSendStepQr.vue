<script>
import CsQrScan from '../../../components/CsQrScan.vue';
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';

export default {
  components: {
    CsQrScan,
    MainLayout,
  },
  extends: CsStep,
};
</script>

<template>
  <MainLayout
    :title="$t('Scan QR')"
  >
    <CsQrScan
      @back="back"
    />
  </MainLayout>
</template>
