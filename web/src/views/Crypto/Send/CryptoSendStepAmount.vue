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
  onShow() {
    if (this.storage.temp?.amount) {
      this.amountValue = this.storage.temp.amount;
      this.storage.temp.amount = undefined;
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
        this.amountValue = await this.$wallet.estimateMaxAmount({
          address: this.storage.address,
          feeRate: this.storage.feeRate,
          gasLimit: this.storage.gasLimit,
          meta: this.storage.meta,
          price: this.storage.priceUSD,
        });
      } catch (err) {
        this.handleError(err);
      } finally {
        this.isLoadingMaxAmount = false;
      }
    },
    async confirm() {
      this.isLoading = true;
      this.error = undefined;
      let fee;
      try {
        await this.$wallet.validateAmount({
          address: this.storage.address,
          feeRate: this.storage.feeRate,
          gasLimit: this.storage.gasLimit,
          meta: this.storage.meta,
          amount: this.amountValue || new Amount(0, this.$wallet.crypto.decimals),
          price: this.storage.priceUSD,
        });
        fee = await this.$wallet.estimateTransactionFee({
          address: this.storage.address,
          feeRate: this.storage.feeRate,
          gasLimit: this.storage.gasLimit,
          meta: this.storage.meta,
          amount: this.amountValue,
          price: this.storage.priceUSD,
        });
        this.updateStorage({
          amount: this.amountValue,
          fee,
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
      if (err instanceof errors.MinimumReserveDestinationError) {
        this.error = this.$t('Value is too small for this destination address, minimum {amount} {symbol}', {
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
      if (err instanceof errors.InsufficientCoinForTransactionFeeError) {
        this.error = this.$t('Insufficient funds to pay the transaction fee. Required {amount} {symbol}', {
          amount: err.amount,
          symbol: this.$wallet.platform.symbol,
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
    :title="$t('Send {symbol}', { symbol: $wallet.crypto.symbol })"
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
