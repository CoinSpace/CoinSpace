<script>
import CsButton from '../../../components/CsButton.vue';
import CsFormGroup from '../../../components/CsForm/CsFormGroup.vue';
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';

export default {
  components: {
    MainLayout,
    CsButton,
    CsFormGroup,
  },
  extends: CsStep,
  data() {
    return {
      isLoading: false,
      error: undefined,
    };
  },
  methods: {
    async disconnect() {
      this.isLoading = true;
      try {
        const walletConnect = await this.$account.walletConnect();
        await walletConnect.disconnectSession();
        this.$router.up();
      } catch (err) {
        // TODO errors
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    },
  },
};
</script>

<template>
  <MainLayout
    :title="$t('WalletConnect')"
  >
    <CsFormGroup class="&__container">
      <div>{{ storage.session.peer.metadata.name }}</div>
      <div>{{ storage.session.peer.metadata.description }}</div>
      <div>{{ storage.session.peer.metadata.url }}</div>
    </CsFormGroup>
    <CsButton
      type="primary"
      :isLoading="isLoading"
      @click="disconnect"
    >
      {{ $t('Disconnect') }}
    </CsButton>
  </MainLayout>
</template>

<style lang="scss">
  .#{ $filename } {
    $self: &;

    &__container {
      flex-grow: 1;
    }
  }
</style>
