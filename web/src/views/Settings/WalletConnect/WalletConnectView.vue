<script>
import CsPinStep from '../../../components/CsPinStep.vue';
import CsSteps from '../../../components/CsSteps.vue';

import WalletConnectStepConfirm from './WalletConnectStepConfirm.vue';
import WalletConnectStepIndex from './WalletConnectStepIndex.vue';
import WalletConnectStepMain from './WalletConnectStepMain.vue';
import WalletConnectStepQr from './WalletConnectStepQr.vue';
import WalletConnectStepStatus from './WalletConnectStepStatus.vue';

import { onShowOnHide } from '../../../lib/mixins.js';

export default {
  components: {
    CsSteps,
  },
  mixins: [onShowOnHide],
  beforeRouteUpdate() {
    this.stepsKey++;
  },
  data() {
    return {
      stepsKey: 0,
    };
  },
  async onShow() {
    const walletConnect = await this.$account.walletConnect();
    walletConnect.on('disconnect', this.disconnect);
  },
  async onHide() {
    const walletConnect = await this.$account.walletConnect();
    await walletConnect.disconnectSession();
    walletConnect.off('disconnect', this.disconnect);
  },
  steps: {
    index: WalletConnectStepIndex,
    main: WalletConnectStepMain,
    confirm: WalletConnectStepConfirm,
    pin: CsPinStep,
    status: WalletConnectStepStatus,
    qr: WalletConnectStepQr,
  },
  methods: {
    disconnect() {
      this.$router.replace({ name: 'settings.walletconnect', force: true });
    },
  },
};
</script>

<template>
  <CsSteps
    :key="stepsKey"
    :steps="$options.steps"
  />
</template>
