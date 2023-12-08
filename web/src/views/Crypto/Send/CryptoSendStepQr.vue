<script>
import { Amount } from '@coinspace/cs-common';

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
        if (parsed.amount) {
          try {
            temp.amount = Amount.fromString(parsed.amount, this.$wallet.crypto.decimals);
          } catch (err) {
            console.error(err);
          }
        }
        if (parsed.destinationTag && this.$wallet.crypto._id === 'xrp@ripple') {
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
