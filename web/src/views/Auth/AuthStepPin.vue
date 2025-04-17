<script>
import AuthStepLayout from '../../layouts/AuthStepLayout.vue';
import CsPin from '../../components/CsPin.vue';
import CsStep from '../../components/CsStep.vue';

export default {
  components: {
    AuthStepLayout,
    CsPin,
  },
  extends: CsStep,
  methods: {
    async setup(pin) {
      await this.$account.create(this.storage.seed, pin);

      if (this.$account.biometry.isAvailable) {
        this.updateStorage({ pin });
        this.next('biometry');
      } else if (this.$account.isNewWallet) {
        this.next('select');
      } else if (this.$account.newCryptosToShow.length) {
        this.next('new');
      } else if (this.$route.redirectedFrom && this.$route.redirectedFrom.name !== 'home') {
        this.$router.push(this.$route.redirectedFrom);
      } else {
        this.$router.replace({ name: 'home' });
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
