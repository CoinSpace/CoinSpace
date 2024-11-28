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
} from '../../../lib/exchanges/BaseExchange.js';
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
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';
import { onShowOnHide } from '../../../lib/mixins';

import ChangeNowIcon from '../../../assets/svg/changenow.svg';
import ChangellyIcon from '../../../assets/svg/changelly.svg';

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
    changenow: ChangeNowIcon,
    changelly: ChangellyIcon,
  },
  extends: CsStep,
  mixins: [onShowOnHide],
  data() {
    return {
      isLoading: false,
      isLoadingMaxAmount: false,
      isEstimating: false,
      subtitle: cryptoSubtitle(this.$wallet),
      amount: undefined,
      errors: {},
      priceTo: undefined,
    };
  },
  async onShow() {
    if (this.$wallet.balance?.value === 0n) {
      this.replace('poor');
      return;
    }
    this.isLoading = true;
    this.updateStorage({
      // cache price for all steps
      price: await this.$account.market.getPrice(this.$wallet.crypto._id, this.$currency),
      pricePlatform: await this.$account.market.getPrice(this.$wallet.platform._id, this.$currency),
      priceUSD: this.$wallet.isCsFeeSupported ?
        await this.$account.market.getPrice(this.$wallet.crypto._id, 'USD') : undefined,
      provider: this.storage.provider || 'changelly',
    });
    this.isLoading = false;
  },
  computed: {
    to() {
      return this.storage.to;
    },
    amountConverted() {
      if (this.priceTo === undefined) {
        return;
      }
      if (this.estimation?.result === undefined) {
        return '0';
      }
      return cryptoToFiat(this.estimation.result, this.priceTo);
    },
    providerName() {
      return this.storage.provider
        ? this.$account.exchanges.getProviderName(this.storage.provider)
        : '–';
    },
    estimation() {
      if (this.storage.provider && this.storage.estimations) {
        return this.storage.estimations.find((item) => item.provider === this.storage.provider);
      }
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
      this.updateStorage({
        estimations: [],
        provider: 'changelly',
      });
      this.errors = {};
    },
    async estimate() {
      if (!this.to || this.amount === undefined || this.amount.value === 0n) {
        this.clean();
        return;
      }
      this.isEstimating = true;
      this.errors = {};
      try {
        if (!this.$account.exchanges.isSupported(this.$wallet.crypto)) throw new ExchangeDisabledError();
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
        const estimations = await this.$account.exchanges.estimateExchange({
          from: this.$wallet.crypto._id,
          to: this.storage.to.crypto._id,
          amount: this.amount,
        });
        this.updateStorage({
          estimations,
          provider: estimations[0].provider,
        });
      } catch (err) {
        this.clean();
        this.handleError(err);
      } finally {
        this.isEstimating = false;
      }
    },
    async confirm() {
      if (!this.to) {
        this.errors['to'] = this.$t('Please select a crypto to exchange');
        return;
      }
      const amount = this.amount || new Amount(0, this.$wallet.crypto.decimals);
      this.isLoading = true;
      this.errors = {};
      try {
        if (!this.$account.exchanges.isSupported(this.$wallet.crypto, this.to.crypto)) {
          throw new ExchangeDisabledError();
        }
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
        const estimation = await this.$account.exchanges.estimateExchange({
          provider: this.storage.provider,
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
        this.updateStorage({ provider: null });
        this.errors['provider'] = this.$t('There are currently no providers available');
        return;
      }
      if (err instanceof InternalExchangeError) {
        this.updateStorage({ provider: null });
        this.errors['provider'] = this.$t('There are currently no providers available');
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
      if (err instanceof errors.InsufficientCoinForTransactionFeeError) {
        this.errors['amount'] = this.$t('Insufficient funds to pay the transaction fee. Required {amount} {symbol}', {
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
        @update:modelValue="errors['amount'] = undefined"
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
      <CsFormDropdown
        :label="$t('Provider')"
        :error="errors['provider']"
        :value="providerName"
        :writable="storage.estimations?.length > 1"
        @click="(storage.estimations?.length > 1 && next('provider'))"
      >
        <template
          v-if="storage.provider"
          #before
        >
          <Component :is="storage.provider" />
        </template>
      </CsFormDropdown>
      <div
        v-if="to && estimation"
        class="&__info"
      >
        <div>{{ estimation.result }} {{ to.crypto.symbol }}</div>
        <div v-if="amountConverted">
          {{ $c(amountConverted) }}
        </div>
      </div>
      <div
        v-if="to && estimation"
        class="&__info"
      >
        1 {{ $wallet.crypto.symbol }} ≈ {{ estimation.rate }} {{ to.crypto.symbol }}
      </div>
    </CsFormGroup>

    <CsButtonGroup>
      <CsButton
        type="primary"
        :isLoading="isLoading || isEstimating"
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
  }
</style>
