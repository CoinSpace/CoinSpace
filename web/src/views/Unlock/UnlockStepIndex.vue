<script>
import AuthStepLayout from '../../layouts/AuthStepLayout.vue';
import CsPin from '../../components/CsPin.vue';
import CsStep from '../../components/CsStep.vue';
import { onShowOnHide, redirectToApp } from '../../lib/mixins.js';

export default {
  components: {
    AuthStepLayout,
    CsPin,
  },
  extends: CsStep,
  mixins: [onShowOnHide, redirectToApp],
  onShow() {
    this.$refs.pin.value = '';
  },
  methods: {
    async success(deviceSeed) {
      await this.$account.open(deviceSeed);
      this.done();
    },
    done() {
      if (this.$account.walletsNeedSynchronization.length) {
        this.next('synchronization');
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
    :title="$t('Enter your PIN')"
    :showBack="false"
    :centered="true"
  >
    <CsPin
      ref="pin"
      mode="deviceSeed"
      logoutButton
      @success="success"
    />
  </AuthStepLayout>
</template>
