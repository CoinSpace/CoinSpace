<script>
import { Amount } from '@coinspace/cs-common';

import CsPinStep from '../../../components/CsPinStep.vue';
import CsSteps from '../../../components/CsSteps.vue';

import CryptoSendStepAddress from './CryptoSendStepAddress.vue';
import CryptoSendStepAmount from './CryptoSendStepAmount.vue';
import CryptoSendStepConfirm from './CryptoSendStepConfirm.vue';
import CryptoSendStepGas from './CryptoSendStepGas.vue';
import CryptoSendStepMecto from './CryptoSendStepMecto.vue';
import CryptoSendStepMeta from './CryptoSendStepMeta.vue';
import CryptoSendStepMinerFee from './CryptoSendStepMinerFee.vue';
import CryptoSendStepPoor from './CryptoSendStepPoor.vue';
import CryptoSendStepQr from './CryptoSendStepQr.vue';
import CryptoSendStepStatus from './CryptoSendStepStatus.vue';

export default {
  components: {
    CsSteps,
  },
  beforeRouteUpdate(to) {
    this.storage.temp = this.parseQuery(to);
    this.stepsKey++;
  },
  data() {
    return {
      storage: { temp: this.parseQuery(this.$route) },
      stepsKey: 0,
    };
  },
  steps: {
    index: CryptoSendStepAddress,
    meta: CryptoSendStepMeta,
    fee: CryptoSendStepMinerFee,
    gas: CryptoSendStepGas,
    amount: CryptoSendStepAmount,
    confirm: CryptoSendStepConfirm,
    status: CryptoSendStepStatus,
    mecto: CryptoSendStepMecto,
    pin: CsPinStep,
    qr: CryptoSendStepQr,
    poor: CryptoSendStepPoor,
  },
  methods: {
    parseQuery(route) {
      const temp = {};
      if (route.query.address) {
        temp.address = route.query.address;
      }
      if (route.query.amount) {
        try {
          temp.amount = Amount.fromString(route.query.amount, this.$wallet.crypto.decimals);
        } catch (err) {
          console.error(err);
        }
      }
      if (route.query.destinationTag && this.$wallet.crypto._id === 'xrp@ripple') {
        temp.meta = {
          destinationTag: route.query.destinationTag,
        };
      }
      return temp;
    },
  },
};
</script>

<template>
  <CsSteps
    :key="stepsKey"
    :steps="$options.steps"
    :initialStorage="storage"
  />
</template>
