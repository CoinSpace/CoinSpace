<script>
import CsPinStep from '../../../components/CsPinStep.vue';
import CsSteps from '../../../components/CsSteps.vue';

import WalletConnectStepConfirm from './WalletConnectStepConfirm.vue';
import WalletConnectStepGas from './WalletConnectStepGas.vue';
import WalletConnectStepIndex from './WalletConnectStepIndex.vue';
import WalletConnectStepMain from './WalletConnectStepMain.vue';
import WalletConnectStepQr from './WalletConnectStepQr.vue';
import WalletConnectStepSign from './WalletConnectStepSign.vue';
import WalletConnectStepStatus from './WalletConnectStepStatus.vue';

import { onShowOnHide } from '../../../lib/mixins.js';

export default {
  components: {
    CsSteps,
  },
  mixins: [onShowOnHide],
  data() {
    return {
      storage: { uri: this.$route.query.uri },
    };
  },
  async onShow() {
    const walletConnect = await this.$account.walletConnect();
    walletConnect.on('disconnect', this.disconnect);
  },
  async onHide() {
    const walletConnect = await this.$account.walletConnect();
    walletConnect.off('disconnect', this.disconnect);
    await walletConnect.disconnectSession();
  },
  steps: {
    index: WalletConnectStepIndex,
    main: WalletConnectStepMain,
    confirm: WalletConnectStepConfirm,
    sign: WalletConnectStepSign,
    pin: CsPinStep,
    status: WalletConnectStepStatus,
    qr: WalletConnectStepQr,
    gas: WalletConnectStepGas,
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
    :steps="$options.steps"
    :initialStorage="storage"
  />
</template>
