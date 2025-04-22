<script>
import CsSteps from '../../components/CsSteps.vue';

import AuthStepBiometry from './AuthStepBiometry.vue';
import AuthStepIndex from './AuthStepIndex.vue';
import AuthStepLogin from './AuthStepLogin.vue';
import AuthStepNewCryptos from './AuthStepNewCryptos.vue';
import AuthStepPassphrase from './AuthStepPassphrase.vue';
import AuthStepPassphraseConfirmation from './AuthStepPassphraseConfirmation.vue';
import AuthStepPassphraseGeneration from './AuthStepPassphraseGeneration.vue';
import AuthStepPin from './AuthStepPin.vue';
import AuthStepSelectCryptos from './AuthStepSelectCryptos.vue';

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
    selectCryptos: AuthStepSelectCryptos,
    newCryptos: AuthStepNewCryptos,
  },
};
</script>

<template>
  <CsSteps :steps="$options.steps" />
</template>
