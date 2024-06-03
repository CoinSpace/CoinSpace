<script>
import CsPinStep from '../../../components/CsPinStep.vue';
import CsSteps from '../../../components/CsSteps.vue';

import WalletConnectConfirm from './WalletConnectConfirm.vue';
import WalletConnectIndex from './WalletConnectIndex.vue';
import WalletConnectMain from './WalletConnectMain.vue';

import { onShowOnHide } from '../../../lib/mixins.js';

export default {
  components: {
    CsSteps,
  },
  mixins: [onShowOnHide],
  async onHide() {
    const walletConnect = await this.$account.walletConnect();
    await walletConnect.disconnectSession();
  },
  steps: {
    index: WalletConnectIndex,
    main: WalletConnectMain,
    confirm: WalletConnectConfirm,
    pin: CsPinStep,
  },
};
</script>

<template>
  <CsSteps
    :steps="$options.steps"
  />
</template>
