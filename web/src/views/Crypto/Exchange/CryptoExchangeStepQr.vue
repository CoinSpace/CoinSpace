<script>
import CsQrScan from '../../../components/CsQrScan.vue';
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';

import { parseCryptoURI } from '../../../lib/cryptoURI.js';

export default {
  components: {
    CsQrScan,
    MainLayout,
  },
  extends: CsStep,
  methods: {
    scan({ uri }) {
      try {
        const parsed = parseCryptoURI(uri);
        const temp = {
          address: parsed.address,
        };
        if (parsed.destinationTag) {
          temp.meta = {
            destinationTag: parsed.destinationTag,
          };
        }
        this.updateStorage({ temp });
        this.back();
      } catch (error) {
        this.back({ error });
      }
    },
  },
};
</script>

<template>
  <MainLayout
    :title="$t('Scan QR')"
  >
    <CsQrScan
      @back="back"
      @scan="scan"
    />
  </MainLayout>
</template>
