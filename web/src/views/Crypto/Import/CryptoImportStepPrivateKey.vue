<script>
import { errors } from '@coinspace/cs-common';

import CsButton from '../../../components/CsButton.vue';
import CsFormGroup from '../../../components/CsForm/CsFormGroup.vue';
import CsFormInput from '../../../components/CsForm/CsFormInput.vue';
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';

export default {
  components: {
    MainLayout,
    CsButton,
    CsFormGroup,
    CsFormInput,
  },
  extends: CsStep,
  data() {
    return {
      isLoading: false,
      privateKey: '',
      error: undefined,
    };
  },
  methods: {
    async confirm() {
      this.isLoading = true;
      const price = await this.$account.market.getPrice(this.$wallet.crypto._id, this.$currency);
      this.updateStorage({
        price,
        address: 'your wallet',
        privateKey: this.privateKey,
      });

      try {
        const amount = await this.$wallet.estimateImport({
          privateKey: this.privateKey,
          feeRate: this.storage.feeRate,
          price: this.storage.priceUSD,
        });
        this.updateStorage({ amount });
        this.next('confirm');
      } catch (err) {
        if (err instanceof errors.SmallAmountError || err instanceof errors.MinimumReserveDestinationError) {
          this.error = this.$t('Balance of private key is too small for transfer. Minimum is {amount} {symbol}', {
            amount: err.amount,
            symbol: this.$wallet.crypto.symbol,
          });
          return;
        }
        if (err instanceof errors.InvalidPrivateKeyError) {
          this.error = this.$t('Invalid private key');
          return;
        }
        if (err instanceof errors.DestinationEqualsSourceError) {
          this.error = this.$t('Destination address should not be equal source address');
          return;
        }
        if (err instanceof errors.InsufficientCoinForTokenTransactionError) {
          this.error = this.$t('Insufficient funds for token transaction. Required {amount} {symbol}', {
            amount: err.amount,
            symbol: this.$wallet.platform.symbol,
          });
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
  <MainLayout :title="$t('Transfer private key')">
    <div class="&__info">
      {{ $t('This will transfer all coins from the private key address to your wallet.') }}
    </div>
    <CsFormGroup class="&__container">
      <CsFormInput
        v-model="privateKey"
        :label="$t('Private key')"
        :clear="true"
        :error="error"
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

    &__info {
      @include text-md;
    }

    &__container {
      flex-grow: 1;
    }
  }
</style>
