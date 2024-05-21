<script>
//import CsPinStep from '../../../components/CsPinStep.vue';
import CsSteps from '../../../components/CsSteps.vue';

import SettingsWalletConnectIndex from './SettingsWalletConnectIndex.vue';
import SettingsWalletConnectMain from './SettingsWalletConnectMain.vue';
import SettingsWalletConnectProposal from './SettingsWalletConnectProposal.vue';

export default {
  components: {
    CsSteps,
  },
  steps: {
    index: SettingsWalletConnectIndex,
    proposal: SettingsWalletConnectProposal,
    main: SettingsWalletConnectMain,
  },
};
</script>

<template>
  <CsSteps
    :steps="$options.steps"
  />
</template>
