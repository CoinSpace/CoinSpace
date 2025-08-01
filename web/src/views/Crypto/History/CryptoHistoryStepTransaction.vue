<script>
import * as MoneroSymbols from '@coinspace/cs-monero-wallet/symbols';
import { Transaction, errors } from '@coinspace/cs-common';

import BaseExchange from '../../../lib/exchanges/BaseExchange.js';
import { cryptoToFiat } from '../../../lib/helpers.js';
import { onShowOnHide } from '../../../lib/mixins.js';

import CsButton from '../../../components/CsButton.vue';
import CsButtonGroup from '../../../components/CsButtonGroup.vue';
import CsFormGroup from '../../../components/CsForm/CsFormGroup.vue';
import CsFormTextareaReadonly from '../../../components/CsForm/CsFormTextareaReadonly.vue';
import CsPoweredBy from '../../../components/CsPoweredBy.vue';
import CsStep from '../../../components/CsStep.vue';
import MainLayout from '../../../layouts/MainLayout.vue';

import ArrowDownIcon from '../../../assets/svg/arrowDown.svg';
import CoinsIcon from '../../../assets/svg/coins.svg';

export default {
  components: {
    MainLayout,
    CsButton,
    CsButtonGroup,
    CsFormGroup,
    CsFormTextareaReadonly,
    CsPoweredBy,
    ArrowDownIcon,
    CoinsIcon,
  },
  extends: CsStep,
  mixins: [onShowOnHide],
  async onShow() {
    if (this.transaction.exchange) {
      try {
        this.transaction = await this.$account.exchanges.reexchangifyTransaction(this.transaction);
      } catch (err) {
        console.error(err);
      }
    }
  },
  data() {
    return {
      transaction: this.args.transaction,
      price: this.args.price,
      isLoading: false,
    };
  },
  computed: {
    from() {
      return this.transaction.from === MoneroSymbols.HIDDEN_ADDRESS
        ? this.$t('Stealth address')
        : this.transaction.from;
    },
    to() {
      if (this.exchange) return this.transaction.exchange.to;
      return this.transaction.to === MoneroSymbols.HIDDEN_ADDRESS
        ? this.$t('Stealth address')
        : this.transaction.to;
    },
    amount() {
      return `${this.transaction.incoming ? '+' : '-'}${this.transaction.amount} ${this.$wallet.crypto.symbol}`;
    },
    amountConverted() {
      return this.$c(cryptoToFiat(this.transaction.amount, this.price));
    },
    status() {
      const { status, confirmations, minConfirmations, timestamp } = this.transaction;
      if (status === Transaction.STATUS_PENDING) {
        return this.$t('Pending confirmation ({confirmations})', {
          confirmations: `${confirmations}/${minConfirmations}`,
        });
      } else if (status === Transaction.STATUS_SUCCESS) {
        return this.$d(timestamp, 'short');
      } else if (status === Transaction.STATUS_FAILED) {
        return this.$t('Failed');
      }
    },
    exchange() {
      if (!this.transaction.exchange) return;
      const { status } = this.transaction.exchange;
      let text;
      if (status === BaseExchange.STATUS_PENDING) {
        text = this.$t('Awaiting transaction confirmation.');
      } else if (status === BaseExchange.STATUS_EXCHANGING) {
        text = this.$t('Deposit has been received. Awaiting swap.');
      } else if (status === BaseExchange.STATUS_REQUIRED_TO_ACCEPT) {
        text = this.$t('Please accept transaction to receive funds.');
      } else if (status === BaseExchange.STATUS_HOLD) {
        text = this.$t('Please contact {exchange} to pass KYC.', {
          exchange: this.transaction.exchange.providerInfo.name,
        });
      } else if (status === BaseExchange.STATUS_REFUNDED) {
        text = this.$t('Swap failed and funds were refunded to your wallet.');
      } else if (status === BaseExchange.STATUS_FAILED) {
        text = this.$t('Swap failed. Please contact {exchange}.', {
          exchange: this.transaction.exchange.providerInfo.name,
        });
      }
      return {
        amount: this.transaction.incoming ?
          `${this.transaction.exchange.amountFrom} ${this.transaction.exchange.cryptoFrom.symbol}` :
          `${this.transaction.exchange.amountTo} ${this.transaction.exchange.cryptoTo.symbol}`,
        status: text,
        isStatusDanger: [
          BaseExchange.STATUS_FAILED,
          BaseExchange.STATUS_REFUNDED,
          BaseExchange.STATUS_HOLD,
        ].includes(status),
        hasAcceptButton: status === BaseExchange.STATUS_REQUIRED_TO_ACCEPT,
      };
    },
  },
  methods: {
    async accelerate() {
      this.isLoading = true;
      try {
        const replacement = await this.$wallet.estimateReplacement(this.transaction);
        const pricePlatform = await this.$account.market.getPrice(this.$wallet.platform._id, this.$currency);
        this.updateStorage({ replacement, pricePlatform, transaction: this.transaction });
        this.next('accelerate');
      } catch (err) {
        if (err instanceof errors.BigAmountError) {
          this.updateStorage({
            status: false,
            message: this.$t('Not enough funds for acceleration.'),
            action: this.$t('Back'),
          });
          this.next('accelerateStatus');
          return;
        }
        this.updateStorage({
          status: false,
        });
        this.next('accelerateStatus');
      } finally {
        this.isLoading = false;
      }
    },
    accept() {
      this.updateStorage({
        payoutHash: this.transaction.exchange.payoutHash,
      });
      this.next('moneroAccept');
    },
  },
};
</script>

<template>
  <MainLayout :title="$t('Transaction')">
    <div class="&__header">
      <div
        class="&__amount-crypto"
        :class="{
          '&__amount-crypto--positive': transaction.incoming,
          '&__amount-crypto--negative': !transaction.incoming,
        }"
      >
        {{ amount }}
      </div>
      <div
        v-if="price"
        class="&__amount-fiat"
      >
        {{ amountConverted }}
      </div>
      <div class="&__status">
        {{ status }}
      </div>

      <template v-if="exchange">
        <ArrowDownIcon
          class="&__arrow"
          :class="{
            '&__arrow--up': transaction.incoming,
          }"
        />
        <div
          class="&__amount-crypto"
        >
          {{ exchange.amount }}
        </div>
        <div
          v-if="exchange.status"
          class="&__status"
          :class="{ '&__status--danger': exchange.isStatusDanger }"
        >
          {{ exchange.status }}
        </div>
      </template>
    </div>

    <div
      v-if="exchange?.hasAcceptButton"
      class="&__accept"
    >
      <CsButton
        type="circle"
        @click="accept"
      >
        <template #circle>
          <CoinsIcon />
        </template>
        {{ $t('Accept') }}
      </CsButton>
    </div>

    <CsFormGroup class="&__info">
      <CsFormTextareaReadonly
        v-if="!transaction.incoming && to !== 'your wallet'"
        :label="$t('Recipient')"
        :value="to"
      />
      <CsFormTextareaReadonly
        v-if="transaction.incoming && transaction.from && !exchange"
        :label="$t('From')"
        :value="from"
      />
      <CsFormTextareaReadonly
        v-if="!transaction.incoming && transaction.fee !== undefined"
        :label="$t('Fee')"
        :value="`${transaction.fee} ${$wallet.crypto.type === 'coin'
          ? $wallet.crypto.symbol : $wallet.platform.symbol}`
          + `${['ethereum@optimism', 'ethereum@base'].includes($wallet.platform._id) ? ' + L1' : ''}`"
      />
      <CsFormTextareaReadonly
        :label="$t('Transaction ID')"
        :value="transaction.id"
      />
      <CsButton
        type="primary-link"
        @click="$safeOpen(transaction.url)"
      >
        {{ $t('View in Block Explorer') }}
      </CsButton>
    </CsFormGroup>
    <CsButtonGroup>
      <template v-if="exchange">
        <CsButton
          type="primary-light"
          @click="$safeOpen(transaction.exchange.trackUrl)"
        >
          {{ $t('Contact {exchange}', {
            exchange: transaction.exchange.providerInfo.name,
          }) }}
        </CsButton>
        <CsPoweredBy :powered="transaction.exchange.providerInfo" />
      </template>
      <CsButton
        v-else-if="transaction.rbf"
        type="primary"
        :isLoading="isLoading"
        @click="accelerate"
      >
        {{ $t('Accelerate') }}
      </CsButton>
    </CsButtonGroup>
  </MainLayout>
</template>

<style lang="scss">
  .#{ $filename } {
    &__header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: $spacing-2xs;
      text-align: center;
    }

    &__amount-crypto {
      @include text-lg;
      @include ellipsis;
      width: 100%;

      &--positive {
        color: $primary;
      }

      &--negative {
        color: $danger;
      }
    }

    &__amount-fiat {
      @include text-sm;
      @include ellipsis;
      width: 100%;
      color: $secondary;
    }

    &__status {
      @include text-sm;
      color: $secondary;

      &--danger {
        color: $danger;
      }
    }

    &__arrow {
      width: $spacing-xl;
      height: $spacing-xl;

      &--up {
        transform: rotate(180deg);
      }
    }

    &__accept {
      display: flex;
      justify-content: center;
    }

    &__info {
      flex-grow: 1;
    }
  }
</style>
