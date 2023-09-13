<script>
import CsSteps from '../../components/CsSteps.vue';

import AuthStepBiometry from './AuthStepBiometry.vue';
import AuthStepIndex from './AuthStepIndex.vue';
import AuthStepLogin from './AuthStepLogin.vue';
import AuthStepPassphrase from './AuthStepPassphrase.vue';
import AuthStepPassphraseConfirmation from './AuthStepPassphraseConfirmation.vue';
import AuthStepPassphraseGeneration from './AuthStepPassphraseGeneration.vue';
import AuthStepPin from './AuthStepPin.vue';

export default {
  components: {
    CsSteps,
  },
  steps: {
    index: AuthStepIndex,
    passphraseGeneration: AuthStepPassphraseGeneration,
    passphrase: AuthStepPassphrase,
    passphraseConfirmation: AuthStepPassphraseConfirmation,
    login: AuthStepLogin,
    pin: AuthStepPin,
    biometry: AuthStepBiometry,
  },
};
</script>

<template>
  <CsSteps :steps="$options.steps" />
</template>
