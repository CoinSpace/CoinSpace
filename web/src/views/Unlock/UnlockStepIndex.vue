<script>
import { CsWallet } from '@coinspace/cs-common';

import AuthStepLayout from '../../layouts/AuthStepLayout.vue';
import CsPin from '../../components/CsPin.vue';
import CsStep from '../../components/CsStep.vue';
import { onShowOnHide } from '../../lib/mixins.js';

export default {
  components: {
    AuthStepLayout,
    CsPin,
  },
  extends: CsStep,
  mixins: [onShowOnHide],
  onShow() {
    this.$refs.pin.value = '';
  },
  methods: {
    async success(deviceSeed) {
      await this.$account.open(deviceSeed);

      const redirect = () => {
        if (this.$route.redirectedFrom?.name !== 'home') {
          this.$router.push(this.$route.redirectedFrom);
        } else {
          this.$router.replace({ name: 'home' });
        }
      };

      const needSynchronization = this.$account.wallets('coin').some((wallet) => {
        return wallet.state === CsWallet.STATE_NEED_INITIALIZATION;
      });
      if (needSynchronization) return this.next('synchronization', { redirect });
      redirect();
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
