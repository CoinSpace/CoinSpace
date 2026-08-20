<script>
import CsButton from '../../components/CsButton.vue';
import CsFormFilepicker from '../../components/CsForm/CsFormFilepicker.vue';
import CsFormGroup from '../../components/CsForm/CsFormGroup.vue';
import CsStep from '../../components/CsStep.vue';
import MainLayout from '../../layouts/MainLayout.vue';

import { walletSeed } from '../../lib/mixins.js';

export default {
  components: {
    MainLayout,
    CsButton,
    CsFormGroup,
    CsFormFilepicker,
  },
  extends: CsStep,
  mixins: [walletSeed],
  data() {
    return {
      isLoading: false,
      errors: {},
      selfie: this.storage.kyc.selfie,
      fileMaxSize: 1 * 1024 * 1024,
      photoMinEdge: 300,
    };
  },
  methods: {
    async confirm() {
      if (!this.selfie) {
        return this.errors.selfie = this.$t('Invalid photo');
      } else if (this.selfie.photoMinEdge < this.photoMinEdge) {
        return this.errors.selfie = this.$t('Photo is too small. Minimum {size}px side.', { size: '300' });
      } else if (this.selfie.size > this.fileMaxSize) {
        return this.errors.selfie = this.$t('Photo is too large. Maximum {size} MB.', { size: '1' });
      }

      this.updateStorage({
        cardAction: 'kyc',
        kyc: {
          ...this.storage.kyc,
          selfie: this.selfie,
        },
      });
      await this.$nextTick();

      this.isLoading = true;
      await this.walletSeed(async () => {
        try {
          await this.$account.cards.submitKyc(this.storage.kyc);
          this.updateStorage({ status: true });
        } catch (err) {
          this.updateStorage({ status: false, error: err });
        } finally {
          this.next('status');
        }
      });
      this.isLoading = false;
    },
  },
};
</script>

<template>
  <MainLayout
    :title="$t('KYC')"
    :description="$t('Additional verification')"
  >
    <CsFormGroup class="&__content">
      <CsFormFilepicker
        v-model="selfie"
        :label="$t('Selfie')"
        :placeholder="$t('Select photo...')"
        :fileMaxSize="fileMaxSize"
        :photoMinEdge="photoMinEdge"
        :error="errors.selfie"
        :clear="true"
        @update:modelValue="errors.selfie = undefined"
      />
    </CsFormGroup>

    <CsButton
      type="primary"
      :isLoading="isLoading"
      @click="confirm"
    >
      {{ $t('Continue') }}
    </CsButton>
  </MainLayout>
</template>

<style lang="scss">
  .#{ $filename } {
    $self: &;

    &__content {
      flex-grow: 1;
    }
  }
</style>
