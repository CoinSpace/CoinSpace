<script>
import AuthStepLayout from '../../layouts/AuthStepLayout.vue';
import CsPin from '../../components/CsPin.vue';
import CsStep from '../../components/CsStep.vue';

import { redirectToApp } from '../../lib/mixins.js';

export default {
  components: {
    AuthStepLayout,
    CsPin,
  },
  extends: CsStep,
  mixins: [redirectToApp],
  methods: {
    async setup(pin) {
      await this.$account.create(this.storage.seed, pin);

      if (this.$account.biometry.isAvailable) {
        this.updateStorage({ pin });
        this.next('biometry');
      } else if (this.$account.cryptosToSelect) {
        this.next('selectCryptos');
      } else {
        this.redirectToApp();
      }
    },
  },
};
</script>

<template>
  <AuthStepLayout
    :title="$t('Set a PIN')"
    :description="$t('for quick access')"
  >
    <CsPin
      mode="setup"
      @success="setup"
    />
  </AuthStepLayout>
</template>
