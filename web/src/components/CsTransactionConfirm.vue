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
      type: Object,
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
    };
  },
  computed: {
    crypto() {
      return this.transaction.crypto || this.$wallet.crypto;
    },
    platform() {
      return this.transaction.platform || this.$wallet.platform;
    },
    amount() {
      if (this.fiatMode && this.transaction.price !== undefined) {
        return this.$c(cryptoToFiat(this.transaction.amount, this.transaction.price));
      } else {
        return `${this.transaction.amount} ${this.crypto.symbol}`;
      }
    },
    fee() {
      if (!this.transaction.fee) return undefined;
      if (this.fiatMode && this.transaction.pricePlatform !== undefined) {
        return this.$t('+{fee} fee', {
          fee: this.$c(cryptoToFiat(this.transaction.fee, this.transaction.pricePlatform)),
        });
      } else {
        return this.$t('{sign}{fee} {symbol} fee', {
          sign: '+',
          fee: this.transaction.fee,
          symbol: this.platform.symbol,
        });
      }
    },
    amountTo() {
      if (this.fiatMode && this.transaction.priceTo !== undefined) {
        return `≈ ${this.$c(cryptoToFiat(this.transaction.amountTo, this.transaction.priceTo))}`;
      } else {
        return `≈ ${this.transaction.amountTo} ${this.transaction.to.crypto.symbol}`;
      }
    },
  },
};
</script>

<template>
  <CsTokenInfo
    class="&__info"
    :crypto="crypto"
    :platform="platform"
    :title="amount"
    :subtitles="fee && [fee]"
    @click="fiatMode = !fiatMode"
  />
  <ArrowDownIcon class="&__arrow" />

  <CsTokenInfo
    v-if="transaction.exchange === true"
    class="&__info"
    :crypto="transaction.to.crypto"
    :platform="transaction.to.platform"
    :title="amountTo"
    @click="fiatMode = !fiatMode"
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
        :label="$t('Destination tag / memo')"
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
      <CsFormTextareaReadonly
        v-if="transaction.extraId"
        :value="transaction.extraId"
        :label="$t('Extra ID')"
      />
    </template>
  </CsFormGroup>

  <CsButtonGroup>
    <CsButton
      type="primary"
      :isLoading="isLoading"
      @click="$emit('confirm')"
    >
      {{ $t('Confirm') }}
    </CsButton>
    <CsPoweredBy
      v-if="powered"
      :powered="powered"
    />
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
