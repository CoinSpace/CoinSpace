<script>
import CsPassphrase from '../../../components/CsPassphrase.vue';
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';

export default {
  components: {
    MainLayout,
    CsPassphrase,
  },
  extends: CsStep,
  data() {
    return {
      isLoading: false,
      passphrase: '',
    };
  },
  methods: {
    async confirm(seed) {
      this.isLoading = true;
      const result = await this.$account.hardware.remove(seed, this.args.credentialID);
      if (result) await this.args.loadKeys();
      this.isLoading = false;
      this.back();
    },
  },
};
</script>

<template>
  <MainLayout :title="$t('Enter passphrase')">
    <CsPassphrase
      v-model="passphrase"
      :isLoading="isLoading"
      @confirm="confirm"
    />
  </MainLayout>
</template>
