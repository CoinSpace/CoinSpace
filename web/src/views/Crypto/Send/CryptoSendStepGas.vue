<script>
import CsButton from '../../../components/CsButton.vue';
import CsFormBigIntInput from '../../../components/CsForm/CsFormBigIntInput.vue';
import CsFormGroup from '../../../components/CsForm/CsFormGroup.vue';
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';

import * as EvmErrors from '@coinspace/cs-evm-wallet/errors';

import { cryptoSubtitle } from '../../../lib/helpers.js';

export default {
  components: {
    MainLayout,
    CsButton,
    CsFormBigIntInput,
    CsFormGroup,
  },
  extends: CsStep,
  data() {
    return {
      isLoading: false,
      subtitle: cryptoSubtitle(this.$wallet),
      gasLimit: this.$wallet.gasLimit,
      error: undefined,
    };
  },
  methods: {
    async confirm() {
      this.isLoading = true;
      try {
        await this.$wallet.validateGasLimit({ gasLimit: this.gasLimit });
        this.error = undefined;
        this.updateStorage({ gasLimit: this.gasLimit });
        this.next('amount');
      } catch (err) {
        if (err instanceof EvmErrors.GasLimitError) {
          this.error = this.$t('Invalid gas limit');
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
    :title="$t('Send {symbol}', { symbol: $wallet.crypto.symbol })"
    :description="subtitle"
  >
    <CsFormGroup class="&__gas">
      <CsFormBigIntInput
        v-model="gasLimit"
        :label="$t('Gas limit')"
        :error="error"
        :info="$t('Gas limit')"
      >
        <template #info>
          <div>
            <!-- eslint-disable-next-line max-len -->
            {{ $t('Gas limit is the amount of gas to send with your transaction. Increasing this number will not get your transaction confirmed faster.') }}
          </div>
        </template>
      </CsFormBigIntInput>
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

    &__gas {
      flex-grow: 1;
    }
  }
</style>
