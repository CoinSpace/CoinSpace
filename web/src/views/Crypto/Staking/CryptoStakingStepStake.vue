<script>
import { cryptoSubtitle } from '../../../lib/helpers.js';
import {
  Amount,
  errors,
} from '@coinspace/cs-common';

import CsButton from '../../../components/CsButton.vue';
import CsFormAmountInput from '../../../components/CsForm/CsFormAmountInput.vue';
import CsFormGroup from '../../../components/CsForm/CsFormGroup.vue';
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';

import { onShowOnHide } from '../../../lib/mixins.js';

export default {
  components: {
    MainLayout,
    CsFormAmountInput,
    CsButton,
    CsFormGroup,
  },
  extends: CsStep,
  mixins: [onShowOnHide],
  async onShow() {
    if (this.$wallet.balance?.value === 0n) {
      this.replace('poor');
      return;
    }
  },
  data() {
    return {
      isLoading: false,
      isLoadingMaxAmount: false,
      subtitle: cryptoSubtitle(this.$wallet),
      amountValue: undefined,
      error: undefined,
    };
  },
  methods: {
    async setMaxAmount() {
      this.isLoadingMaxAmount = true;
      try {
        this.amountValue = await this.$wallet.estimateStakeMaxAmount({ price: this.storage.priceUSD });
      } catch (err) {
        this.handleError(err);
      } finally {
        this.isLoadingMaxAmount = false;
      }
    },
    async confirm() {
      this.isLoading = true;
      this.error = undefined;
      try {
        const amount = this.amountValue || new Amount(0, this.$wallet.crypto.decimals);
        await this.$wallet.validateStakeAmount({
          amount,
          price: this.storage.priceUSD,
        });
        const estimation = await this.$wallet.estimateStake({
          amount,
          price: this.storage.priceUSD,
        });
        this.updateStorage({
          method: 'stake',
          title: this.$t('Confirm stake'),
          amount,
          address: estimation.to,
          fee: estimation.fee,
        });
        this.next('confirm');
      } catch (err) {
        this.handleError(err);
      } finally {
        this.isLoading = false;
      }
    },
    handleError(err) {
      if (err instanceof errors.SmallAmountError) {
        this.error = this.$t('Value is too small, minimum {amount} {symbol}', {
          amount: err.amount,
          symbol: this.$wallet.crypto.symbol,
        });
        return;
      }
      if (err instanceof errors.BigAmountError) {
        this.error = this.$t('Value is too big, maximum {amount} {symbol} (incl. fee)', {
          amount: err.amount,
          symbol: this.$wallet.crypto.symbol,
        });
        return;
      }
      if (err instanceof errors.BigAmountConfirmationPendingError) {
        // eslint-disable-next-line max-len
        this.error = this.$t('Some funds are temporarily unavailable. To send this transaction, you will need to wait for your pending transactions to be confirmed first. Available {amount} {symbol}', {
          amount: err.amount,
          symbol: this.$wallet.crypto.symbol,
        });
        return;
      }
      console.error(err);
    },
  },
};
</script>

<template>
  <MainLayout
    :title="$t('Stake {symbol}', { symbol: $wallet.crypto.symbol })"
    :description="subtitle"
  >
    <CsFormGroup class="&__content">
      <CsFormAmountInput
        v-model="amountValue"
        :label="$t('Amount')"
        :error="error"
        :decimals="$wallet.crypto.decimals"
        :symbol="$wallet.crypto.symbol"
        :factors="$wallet.isFactorsSupported ? $wallet.factors : []"
        :price="storage.price"
        :currency="$currency"
        @update:modelValue="error = undefined"
      />
      <CsButton
        type="secondary"
        :isLoading="isLoadingMaxAmount"
        @click="setMaxAmount"
      >
        {{ $t('max') }}
      </CsButton>
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
