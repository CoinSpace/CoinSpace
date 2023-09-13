<script>
import CsButton from '../../../components/CsButton.vue';
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';
import { walletSeed } from '../../../lib/mixins.js';

export default {
  components: {
    MainLayout,
    CsButton,
  },
  extends: CsStep,
  mixins: [walletSeed],
  data() {
    return {
      isLoading: false,
    };
  },
  methods: {
    async remove() {
      this.isLoading = true;
      await this.walletSeed(async (walletSeed) => {
        await this.$account.remove(walletSeed);
        this.$router.replace({ name: 'auth' });
      });
      this.isLoading = false;
    },
  },
};
</script>

<template>
  <MainLayout
    :title="$t('Remove account')"
  >
    <div
      class="&__container"
    >
      <div class="&__note">
        {{ $t('Are you sure you wish to remove your account? You cannot undo this action.') }}
      </div>
    </div>
    <CsButton
      type="danger-light"
      :isLoading="isLoading"
      @click="remove"
    >
      {{ $t('Remove account') }}
    </CsButton>
  </MainLayout>
</template>

<style lang="scss">
  .#{ $filename } {
    $self: &;

    &__container {
      flex-grow: 1;
    }

    &__note {
      @include text-md;
    }
  }
</style>
