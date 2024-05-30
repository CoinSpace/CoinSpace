<script>
import CsPinStep from '../../../components/CsPinStep.vue';
import CsSteps from '../../../components/CsSteps.vue';

import SettingsWalletConnectConfirm from './SettingsWalletConnectConfirm.vue';
import SettingsWalletConnectIndex from './SettingsWalletConnectIndex.vue';
import SettingsWalletConnectMain from './SettingsWalletConnectMain.vue';

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
    index: SettingsWalletConnectIndex,
    main: SettingsWalletConnectMain,
    confirm: SettingsWalletConnectConfirm,
    pin: CsPinStep,
  },
};
</script>

<template>
  <CsSteps
    :steps="$options.steps"
  />
</template>
