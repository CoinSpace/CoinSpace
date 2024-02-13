<script>
import {
  Amount,
  errors,
} from '@coinspace/cs-common';
import {
  ExchangeAmountError,
  ExchangeBigAmountError,
  ExchangeDisabledError,
  ExchangeSmallAmountError,
  InternalExchangeError,
} from '../../../lib/account/ChangellyExchange.js';
import {
  cryptoSubtitle,
  cryptoToFiat,
} from '../../../lib/helpers.js';

import CsButton from '../../../components/CsButton.vue';
import CsButtonGroup from '../../../components/CsButtonGroup.vue';
import CsCryptoLogo from '../../../components/CsCryptoLogo.vue';
import CsFormAmountInput from '../../../components/CsForm/CsFormAmountInput.vue';
import CsFormDropdown from '../../../components/CsForm/CsFormDropdown.vue';
import CsFormGroup from '../../../components/CsForm/CsFormGroup.vue';
import CsPoweredBy from '../../../components/CsPoweredBy.vue';
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';
import { onShowOnHide } from '../../../lib/mixins';

import debounce from 'p-debounce';

export default {
  components: {
    MainLayout,
    CsFormAmountInput,
    CsButton,
    CsButtonGroup,
    CsCryptoLogo,
    CsFormDropdown,
    CsFormGroup,
    CsPoweredBy,
  },
  extends: CsStep,
  mixins: [onShowOnHide],
  data() {
    return {
      isLoading: false,
      isLoadingMaxAmount: false,
      subtitle: cryptoSubtitle(this.$wallet),
      amount: undefined,
      errors: {},
      rate: undefined,
      result: undefined,
      priceTo: undefined,
    };
  },
  async onShow() {
    if (this.$wallet.balance?.value === 0n) {
      this.replace('poor');
      return;
    }
    this.updateStorage({
      // cache price for all steps
      price: await this.$account.market.getPrice(this.$wallet.crypto._id, this.$currency),
      pricePlatform: await this.$account.market.getPrice(this.$wallet.platform._id, this.$currency),
      priceUSD: this.$wallet.isCsFeeSupported ?
        await this.$account.market.getPrice(this.$wallet.crypto._id, 'USD') : undefined,
    });
  },
  computed: {
    to() {
      return this.storage.to;
    },
    amountConverted() {
      if (this.priceTo === undefined) {
        return;
      }
      if (this.result === undefined) {
        return '0';
      }
      return cryptoToFiat(this.result, this.priceTo);
    },
  },
  watch: {
    amount: debounce(function() {
      this.estimate();
    }, 300),
    async to() {
      this.clean();
      this.estimate();
      if (this.storage.to) {
        this.priceTo = await this.$account.market.getPrice(this.storage.to.crypto._id, this.$currency);
      } else {
        this.priceTo = undefined;
      }
    },
  },
  methods: {
    clean() {
      this.rate = undefined;
      this.result = undefined;
      this.errors = {};
    },
    async estimate() {
      if (!this.to || this.amount === undefined || this.amount.value === 0n) {
        this.clean();
        return;
      }
      this.isLoading = true;
      try {
        if (!this.$wallet.crypto.changelly) throw new ExchangeDisabledError();
        if (this.$wallet.isFeeRatesSupported) await this.$wallet.loadFeeRates();
        await this.$wallet.validateAmount({
          address: this.$wallet.dummyExchangeDepositAddress,
          // use default fee rate
          feeRate: this.$wallet.isFeeRatesSupported ? this.$wallet.feeRates[0] : undefined,
          // use default gas limit
          gasLimit: this.$wallet.isGasLimitSupported ? this.$wallet.gasLimit : undefined,
          amount: this.amount,
          price: this.storage.priceUSD,
        });
        const estimation = await this.$account.exchange.estimateExchange({
          from: this.$wallet.crypto._id,
          to: this.storage.to.crypto._id,
          amount: this.amount,
        });
        this.errors = {};
        this.rate = estimation.rate;
        this.result = estimation.result;
      } catch (err) {
        this.clean();
        this.handleError(err);
      } finally {
        this.isLoading = false;
      }
    },
    async confirm() {
      if (!this.to) {
        this.errors['to'] = this.$t('Please select a crypto to exchange');
        return;
      }
      const amount = this.amount || new Amount(0, this.$wallet.crypto.decimals);
      this.isLoading = true;
      try {
        if (!this.$wallet.crypto.changelly) throw new ExchangeDisabledError();
        if (this.$wallet.isFeeRatesSupported) await this.$wallet.loadFeeRates();
        await this.$wallet.validateAmount({
          address: this.$wallet.dummyExchangeDepositAddress,
          // use default fee rate
          feeRate: this.$wallet.isFeeRatesSupported ? this.$wallet.feeRates[0] : undefined,
          // use default gas limit
          gasLimit: this.$wallet.isGasLimitSupported ? this.$wallet.gasLimit : undefined,
          amount,
          price: this.storage.priceUSD,
        });
        const estimation = await this.$account.exchange.estimateExchange({
          from: this.$wallet.crypto._id,
          to: this.storage.to.crypto._id,
          amount,
        });
        const fee = await this.$wallet.estimateTransactionFee({
          address: this.$wallet.dummyExchangeDepositAddress,
          feeRate: this.$wallet.isFeeRatesSupported ? this.$wallet.feeRates[0] : undefined,
          gasLimit: this.$wallet.isGasLimitSupported ? this.$wallet.gasLimit : undefined,
          amount,
          price: this.storage.priceUSD,
        });
        this.updateStorage({
          exchange: true,
          amount,
          amountTo: estimation.result,
          address: (this.to.crypto.supported !== false && this.$account.wallet(this.to.crypto._id))
            ? 'your wallet' : undefined,
          priceTo: this.priceTo,
          fee,
        });
        this.next('address');
      } catch (err) {
        this.handleError(err);
      } finally {
        this.isLoading = false;
      }
    },
    async setMaxAmount() {
      this.isLoadingMaxAmount = true;
      try {
        if (this.$wallet.isFeeRatesSupported) await this.$wallet.loadFeeRates();
        this.amount = await this.$wallet.estimateMaxAmount({
          address: this.$wallet.dummyExchangeDepositAddress,
          feeRate: this.$wallet.isFeeRatesSupported ? this.$wallet.feeRates[0] : undefined,
          gasLimit: this.$wallet.gasLimit,
          price: this.storage.priceUSD,
        });
      } catch (err) {
        this.handleError(err);
      } finally {
        this.isLoadingMaxAmount = false;
      }
    },
    handleError(err) {
      if (err instanceof ExchangeSmallAmountError) {
        this.errors['amount'] = this.$t('Value is too small, minimum {amount} {symbol}', {
          amount: err.amount,
          symbol: this.$wallet.crypto.symbol,
        });
        return;
      }
      if (err instanceof ExchangeBigAmountError) {
        this.errors['amount'] = this.$t('Value is too big, maximum {amount} {symbol} (incl. fee)', {
          amount: err.amount,
          symbol: this.$wallet.crypto.symbol,
        });
        return;
      }
      if (err instanceof errors.SmallAmountError) {
        this.errors['amount'] = this.$t('Value is too small, minimum {amount} {symbol}', {
          amount: err.amount,
          symbol: this.$wallet.crypto.symbol,
        });
        return;
      }
      if (err instanceof errors.BigAmountError) {
        this.errors['amount'] = this.$t('Not enough funds on your balance, maximum {amount} {symbol}', {
          amount: err.amount,
          symbol: this.$wallet.crypto.symbol,
        });
        return;
      }
      if (err instanceof ExchangeDisabledError) {
        this.errors['amount'] = this.$t('Exchange is currently unavailable for this pair');
        return;
      }
      if (err instanceof InternalExchangeError) {
        this.errors['amount'] = this.$t('Exchange is unavailable');
        return;
      }
      if (err instanceof errors.MinimumReserveDestinationError) {
        this.errors['amount'] = this.$t('Value is too small for this destination address, minimum {amount} {symbol}', {
          amount: err.amount,
          symbol: this.$wallet.crypto.symbol,
        });
        return;
      }
      if (err instanceof errors.BigAmountConfirmationPendingError) {
        // eslint-disable-next-line max-len
        this.errors['amount'] = this.$t('Some funds are temporarily unavailable. To send this transaction, you will need to wait for your pending transactions to be confirmed first. Available {amount} {symbol}', {
          amount: err.amount,
          symbol: this.$wallet.crypto.symbol,
        });
        return;
      }
      if (err instanceof errors.InsufficientCoinForTokenTransactionError) {
        this.errors['amount'] = this.$t('Insufficient funds for token transaction. Required {amount} {symbol}', {
          amount: err.amount,
          symbol: this.$wallet.platform.symbol,
        });
        return;
      }
      if (err instanceof ExchangeAmountError) {
        this.errors['amount'] = this.$t('Invalid value');
        return;
      }
      console.error(err);
    },
  },
};
</script>

<template>
  <MainLayout
    :title="$t('Exchange {symbol}', { symbol: $wallet.crypto.symbol })"
    :description="subtitle"
  >
    <CsFormGroup>
      <CsFormAmountInput
        v-model="amount"
        :label="$t('Amount')"
        :error="errors['amount']"
        :decimals="$wallet.crypto.decimals"
        :symbol="$wallet.crypto.symbol"
        :factors="$wallet.isFactorsSupported ? $wallet.factors : []"
        :price="storage.price"
        :currency="$currency"
      />
      <CsButton
        type="secondary"
        :isLoading="isLoadingMaxAmount"
        @click="setMaxAmount"
      >
        {{ $t('max') }}
      </CsButton>
    </CsFormGroup>

    <CsFormGroup class="&__growing-group">
      <CsFormDropdown
        :label="$t('To')"
        :error="errors['to']"
        :value="to && to.crypto.name"
        @click="next('target')"
      >
        <template #before>
          <CsCryptoLogo
            v-if="to"
            :crypto="to.crypto"
            :platform="to.platform"
          />
        </template>
      </CsFormDropdown>
      <div
        v-if="to && result"
        class="&__info"
      >
        <div>{{ result }} {{ to.crypto.symbol }}</div>
        <div v-if="amountConverted">
          {{ $c(amountConverted) }}
        </div>
      </div>
    </CsFormGroup>

    <CsButtonGroup>
      <div class="&__powered">
        <div v-if="to && rate">
          1 {{ $wallet.crypto.symbol }} ≈ {{ rate }} {{ to.crypto.symbol }}
        </div>
        <CsPoweredBy powered="changelly" />
      </div>
      <CsButton
        type="primary"
        :isLoading="isLoading"
        @click="confirm"
      >
        {{ $t('Continue') }}
      </CsButton>
    </CsButtonGroup>
  </MainLayout>
</template>

<style lang="scss">
  .#{ $filename } {
    $self: &;

    &__growing-group {
      flex-grow: 1;
    }

    &__info {
      @include text-md;
    }

    &__powered {
      @include text-xs;
      display: flex;
      flex-direction: column;
      color: $secondary;
      gap: $spacing-2xs;
      text-align: center;
    }
  }
</style>
