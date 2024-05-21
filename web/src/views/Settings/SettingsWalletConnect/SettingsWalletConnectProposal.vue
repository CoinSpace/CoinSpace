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
    async confirm() {
      this.isLoading = true;
      try {
        const walletConnect = await this.$account.walletConnect();
        const session = await walletConnect.approveSession(this.storage.proposal);
        this.updateStorage({ session });
        this.next('main');
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
      <div>{{ storage.proposal.params.proposer.metadata.name }}</div>
      <div>{{ storage.proposal.params.proposer.metadata.description }}</div>
      <div>{{ storage.proposal.params.proposer.metadata.url }}</div>
    </CsFormGroup>
    <CsButton
      type="primary"
      :isLoading="isLoading"
      @click="confirm"
    >
      {{ $t('Confirm') }}
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
