<script>
import AuthStepLayout from '../../layouts/AuthStepLayout.vue';
import CsPassphrase from '../../components/CsPassphrase.vue';
import CsStep from '../../components/CsStep.vue';

export default {
  components: {
    AuthStepLayout,
    CsPassphrase,
  },
  extends: CsStep,
  data() {
    return {
      passphrase: '',
    };
  },
  methods: {
    confirm(seed) {
      this.updateStorage({ seed });
      this.next('pin');
    },
  },
};
</script>

<template>
  <AuthStepLayout :title="$t('Enter passphrase')">
    <CsPassphrase
      v-model="passphrase"
      @confirm="confirm"
    />
  </AuthStepLayout>
</template>
