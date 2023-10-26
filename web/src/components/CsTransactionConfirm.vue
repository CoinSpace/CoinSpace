<script>
import { cryptoToFiat } from '../lib/helpers.js';

import CsButton from '../components/CsButton.vue';
import CsButtonGroup from './CsButtonGroup.vue';
import CsFormGroup from '../components/CsForm/CsFormGroup.vue';
import CsFormTextareaReadonly from '../components/CsForm/CsFormTextareaReadonly.vue';
import CsPoweredBy from '../components/CsPoweredBy.vue';
import CsTokenInfo from '../components/CsTokenInfo.vue';

import ArrowDownIcon from '../assets/svg/arrowDown.svg';
import WalletSmallIcon from '../assets/svg/walletSmall.svg';

export default {
  components: {
    CsButton,
    CsButtonGroup,
    CsFormGroup,
    CsFormTextareaReadonly,
    CsPoweredBy,
    CsTokenInfo,
    ArrowDownIcon,
    WalletSmallIcon,
  },
  props: {
    transaction: {
      type: Object,
      default() {
        return {};
      },
    },
    powered: {
      type: String,
      default: undefined,
    },
    isLoading: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['confirm'],
  data() {
    return {
      fiatMode: false,
      isFiatModeSupported: this.transaction.price !== undefined,
    };
  },
  computed: {
    amountFiat() {
      if (this.isFiatModeSupported) {
        return cryptoToFiat(this.transaction.amount, this.transaction.price);
      }
    },
    feeFiat() {
      if (this.isFiatModeSupported && this.transaction.fee) {
        return cryptoToFiat(this.transaction.fee, this.transaction.price);
      }
    },
    amount() {
      if (!this.fiatMode) {
        return `${this.transaction.amount}  ${this.$wallet.crypto.symbol}`;
      } else {
        return this.$c(this.amountFiat);
      }
    },
    fee() {
      if (!this.transaction.fee) return undefined;
      if (!this.fiatMode) {
        return this.$t('{sign}{fee} {symbol} fee', {
          sign: '+',
          fee: this.transaction.fee,
          symbol: this.$wallet.platform.symbol,
        });
      } else {
        return this.$t('+{fee} fee', {
          fee: this.$c(this.feeFiat),
        });
      }
    },
    amountToFiat() {
      if (this.isFiatModeSupported && this.transaction.priceTo) {
        return cryptoToFiat(this.transaction.amountTo, this.transaction.priceTo);
      }
    },
    amountTo() {
      if (!this.fiatMode) {
        return `≈ ${this.transaction.amountTo}  ${this.transaction.to.crypto.symbol}`;
      } else {
        if (this.amountToFiat) {
          return `≈ ${this.$c(this.amountToFiat)}`;
        }
      }
    },
  },
  methods: {
    switchMode() {
      if (this.isFiatModeSupported) {
        this.fiatMode = !this.fiatMode;
      }
    },
  },
};
</script>

<template>
  <CsTokenInfo
    class="&__info"
    :crypto="$wallet.crypto"
    :platform="$wallet.platform"
    :title="amount"
    :subtitles="fee && [fee]"
    @click="switchMode"
  />
  <ArrowDownIcon class="&__arrow" />

  <CsTokenInfo
    v-if="transaction.exchange === true"
    class="&__info"
    :crypto="transaction.to.crypto"
    :platform="transaction.to.platform"
    :title="amountTo"
    @click="switchMode"
  />

  <CsFormGroup class="&__content">
    <template v-if="transaction.exchange !== true && transaction.address === 'your wallet'">
      <CsFormTextareaReadonly
        :value="$t('Your wallet')"
        :label="$t('Wallet address')"
      >
        <template #before>
          <WalletSmallIcon />
        </template>
      </CsFormTextareaReadonly>
    </template>
    <template v-if="transaction.address !== 'your wallet'">
      <CsFormTextareaReadonly
        v-if="transaction.alias"
        :value="transaction.alias"
        :label="$t('Alias')"
      />
      <CsFormTextareaReadonly
        :value="transaction.address"
        :label="$t('Wallet address')"
      />
      <CsFormTextareaReadonly
        v-if="transaction.meta?.destinationTag"
        :value="transaction.meta?.destinationTag"
        :label="$t('Destination tag')"
      />
      <CsFormTextareaReadonly
        v-if="transaction.meta?.invoiceID"
        :value="transaction.meta?.invoiceID"
        :label="$t('Invoice ID')"
      />
      <CsFormTextareaReadonly
        v-if="transaction.meta?.memo"
        :value="transaction.meta?.memo"
        :label="$t('Memo')"
      />
    </template>
  </CsFormGroup>

  <CsButtonGroup>
    <CsPoweredBy
      v-if="powered"
      :powered="powered"
    />
    <CsButton
      type="primary"
      :isLoading="isLoading"
      @click="$emit('confirm')"
    >
      {{ $t('Confirm') }}
    </CsButton>
  </CsButtonGroup>
</template>

<style lang="scss">
  .#{ $filename } {
    $self: &;

    &__info {
      cursor: pointer;
    }

    &__content {
      flex-grow: 1;
    }

    &__arrow {
      width: $spacing-xl;
      height: $spacing-xl;
      align-self: center;
    }
  }
</style>
