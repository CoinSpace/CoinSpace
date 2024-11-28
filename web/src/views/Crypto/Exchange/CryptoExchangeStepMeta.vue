<script>
import { errors } from '@coinspace/cs-common';

import CsButton from '../../../components/CsButton.vue';
import CsFormGroup from '../../../components/CsForm/CsFormGroup.vue';
import CsFormInput from '../../../components/CsForm/CsFormInput.vue';
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';

import { cryptoSubtitle } from '../../../lib/helpers.js';
import { onShowOnHide } from '../../../lib/mixins.js';

export default {
  components: {
    MainLayout,
    CsButton,
    CsFormGroup,
    CsFormInput,
  },
  extends: CsStep,
  mixins: [onShowOnHide],
  onShow() {
    if (this.storage.temp?.meta?.destinationTag) {
      this.extraId = this.storage.temp.meta.destinationTag;
      this.storage.temp.meta.destinationTag = undefined;
    }
  },
  data() {
    return {
      isLoading: false,
      subtitle: cryptoSubtitle(this.$wallet),
      error: undefined,
      extraId: undefined,
    };
  },
  methods: {
    async confirm() {
      this.isLoading = true;
      this.error = undefined;
      try {
        await this.$account.exchanges.validateAddress({
          to: this.storage.to.crypto._id,
          address: this.storage.address,
          extraId: this.extraId,
        });
        this.updateStorage({
          extraId: this.extraId,
        });
        this.next('confirm');
      } catch (err) {
        if (err instanceof errors.EmptyAddressError) {
          this.error = this.$t('Invalid extra ID');
          return;
        }
        if (err instanceof errors.InvalidAddressError) {
          this.error = this.$t('Invalid extra ID');
          return;
        }
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
    :title="$t('Exchange {symbol}', { symbol: $wallet.crypto.symbol })"
    :description="subtitle"
  >
    <CsFormGroup class="&__container">
      <CsFormInput
        v-model="extraId"
        :label="$t('Extra ID')"
        :placeholder="$t('(optional)')"
        :error="error"
        @update:modelValue="error = undefined"
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

    &__container {
      flex-grow: 1;
    }
  }
</style>
